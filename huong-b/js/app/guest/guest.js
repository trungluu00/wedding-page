// Điều phối trang khách — dựa trên js/app/guest/guest.js của dewanakl/undangan v3.14.0
// (màn tải → bìa thư → "Mở thiệp" bật nhạc + confetti → nội dung, đếm ngược, modal ảnh, nút sáng/tối).
// Khác bản gốc: nội dung dựng từ wedding.config.js, tên khách tra qua Apps Script theo ?to=,
// sự kiện lọc theo nhóm khách, RSVP + lời chúc thay cho bình luận PHP.
import config from '../../../wedding.config.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { forms } from './forms.js';
import { wishTicker } from './wish-ticker.js';
import {
    renderCover, renderMain, renderNavbar, renderDesktopSide, guestDisplay, visibleEvents, mainEvent, ornament, sideFromParam,
} from './render.js';
import { util } from '../../common/util.js';
import { theme } from '../../common/theme.js';
import { offline } from '../../common/offline.js';
import { storage } from '../../common/storage.js';
import { eventDate } from '../../common/format.js';
import { appsScript, applySettings } from '../../connection/apps-script.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import * as confetti from '../../libs/confetti.js';

const LOOKUP_TIMEOUT_MS = 6000;
const SETTINGS_TIMEOUT_MS = 4000;

export const guest = (() => {

    const cfg = config;
    const client = appsScript(cfg.backend?.appsScriptUrl);
    const f = forms(client);
    const ticker = wishTicker();
    let wishesLoaded = Promise.resolve([]);

    /** Giờ sự kiện / tài khoản mừng cưới trên Google Sheet; chậm hoặc lỗi → dùng wedding.config.js. */
    const loadSettings = async () => {
        try {
            const res = await Promise.race([
                client.settings(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), SETTINGS_TIMEOUT_MS)),
            ]);
            return res?.success ? res.data : null;
        } catch (e) {
            console.warn('[thiệp] không tải được cấu hình từ Sheet:', e.message);
            return null;
        }
    };

    /** @type {object} */
    let ctx = null;

    /** Đọc ?to= và tra khách. Không tìm thấy mà trông giống tên người → dùng làm tên hiển thị. */
    const resolveGuest = async () => {
        const params = new URLSearchParams(window.location.search);
        const raw = (params.get('to') ?? '').trim().slice(0, 80);
        // Tên có dấu kèm trong link (&n=Bác%20Hùng, do Google Sheet tự sinh) — dùng khi không tra được khách
        const nameFromLink = (params.get('n') ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
        if (!raw) {
            return nameFromLink ? { guest: null, code: '', khach: nameFromLink, plain: nameFromLink } : { guest: null, code: '', khach: 'Quý vị', plain: '' };
        }

        let found = null;
        let unanswered = false; // Sheet lỗi / quá chậm (khác với "không có mã này")
        try {
            const res = await Promise.race([
                client.lookup(raw),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), LOOKUP_TIMEOUT_MS)),
            ]);
            if (res?.success && res.found && res.data) {
                found = res.data;
            } else if (!res?.success) {
                unanswered = true;
            }
        } catch (e) {
            unanswered = true;
            console.warn('[thiệp] không tra được khách:', e.message);
        }

        if (found) {
            const khach = guestDisplay(found);
            return { guest: found, code: String(found.code ?? ''), khach, plain: khach };
        }
        // Chưa tra được thì vẫn giữ mã trong link: xác nhận tham dự gửi kèm mã để Sheet tự đánh dấu đúng khách
        const code = unanswered && /^[a-z0-9][a-z0-9-]{0,63}$/i.test(raw) ? raw.toLowerCase() : '';
        if (nameFromLink) {
            return { guest: null, code, khach: nameFromLink, plain: nameFromLink };
        }
        const looksLikeName = /\s/.test(raw) || /[^a-z0-9_-]/i.test(raw);
        return looksLikeName ? { guest: null, code: '', khach: raw, plain: raw } : { guest: null, code, khach: 'Quý vị', plain: '' };
    };

    const countDown = () => {
        const target = ctx.main ? eventDate(ctx.main) : null;
        const boxes = document.getElementById('countdown-boxes');
        if (!target || !boxes) {
            return;
        }
        const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
        const els = ['day', 'hour', 'minute', 'second'].map((id) => document.getElementById(id));

        const tick = () => {
            const distance = target.getTime() - Date.now();
            if (distance <= 0) {
                const sameDay = Math.abs(distance) < 24 * 60 * 60 * 1000;
                boxes.replaceChildren(util.h('p', { class: 'quote m-0' }, sameDay ? 'Hôm nay là ngày vui của chúng tôi!' : 'Xin chân thành cảm ơn anh chị và các bạn đã chung vui cùng chúng tôi!'));
                return;
            }
            els[0].textContent = pad(Math.floor(distance / 86400000));
            els[1].textContent = pad(Math.floor((distance % 86400000) / 3600000));
            els[2].textContent = pad(Math.floor((distance % 3600000) / 60000));
            els[3].textContent = pad(Math.floor((distance % 60000) / 1000));
            setTimeout(tick, 1000 - (Date.now() % 1000));
        };
        tick();
    };

    /**
     * Nút nổi "Xác nhận tham dự" ngay trên thanh điều hướng + đánh dấu mục "Xác nhận" trên thanh.
     * Hiện vài giây sau khi mở thiệp; ẩn khi đang xem mục xác nhận / mở ảnh; ẩn hẳn khi khách đã gửi.
     */
    const rsvpReminder = () => {
        const section = document.getElementById('rsvp');
        const col = document.getElementById('main')?.parentElement;
        if (!section || !col || document.getElementById('rsvp-cta')) {
            return;
        }
        const { h, icon } = util;
        let done = !!storage('rsvp').get('last');
        let inView = false;
        let armed = false;
        // "2026-12-02" → "02/12" (đọc thẳng từ chuỗi, không qua Date nên không lệch múi giờ)
        const dl = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(cfg.backend?.rsvpDeadline ?? '').trim());
        const sub = dl ? `Xin vui lòng phản hồi trước ${dl[2]}/${dl[1]}` : 'Để chúng tôi chuẩn bị chu đáo';
        const btn = h('button', {
            type: 'button', class: 'rsvp-cta', id: 'rsvp-cta', hidden: true,
            onclick: () => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => document.getElementById('rsvp-name')?.focus({ preventScroll: true }), 700);
            },
        },
        h('span', { class: 'rsvp-cta-ring', 'aria-hidden': 'true' }),
        h('span', { class: 'rsvp-cta-icon', 'aria-hidden': 'true' }, icon('fa-envelope-open-text')),
        h('span', { class: 'rsvp-cta-text' }, h('strong', null, 'Xác nhận tham dự'), h('small', null, sub)),
        icon('fa-chevron-right', 'rsvp-cta-arrow'));
        const zone = h('div', { class: 'rsvp-cta-zone' }, btn);
        col.insertBefore(zone, document.getElementById('navbar-menu'));

        const update = () => {
            const show = armed && !done && !inView && !document.querySelector('.modal.show');
            document.body.classList.toggle('rsvp-cta-on', show);
            if (show && btn.hidden) {
                btn.hidden = false;
                requestAnimationFrame(() => requestAnimationFrame(() => btn.classList.add('is-in')));
            } else if (!show && !btn.hidden) {
                btn.classList.remove('is-in');
                btn.hidden = true;
            }
            const link = document.querySelector('#navbar-list a[href="#rsvp"]');
            if (link) {
                link.classList.toggle('nav-rsvp-todo', !done);
                link.classList.toggle('nav-rsvp-done', done);
                const i = link.querySelector('i');
                if (i) i.className = `fa-solid ${done ? 'fa-circle-check' : 'fa-envelope-circle-check'}`;
                const label = link.querySelector('span');
                if (label) label.textContent = done ? 'Đã xác nhận' : 'Xác nhận';
            }
        };
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                inView = entries.some((en) => en.isIntersecting);
                update();
            }, { threshold: 0.12 }).observe(section);
        }
        document.addEventListener('rsvp:done', () => {
            done = true;
            update();
        });
        document.addEventListener('shown.bs.modal', update);
        document.addEventListener('hidden.bs.modal', update);
        setTimeout(() => {
            armed = true;
            update();
        }, 4000);
        update();
    };

    /** Chia sẻ thiệp: link chung theo nhà (không kèm mã khách riêng). */
    const share = async () => {
        const url = `${window.location.origin}${window.location.pathname}${ctx.side ? `?ben=${ctx.side}` : ''}`;
        const title = `Thiệp cưới ${cfg.couple.groom.shortName} & ${cfg.couple.bride.shortName}`;
        try {
            if (navigator.share) {
                await navigator.share({ title, text: cfg.site?.description || title, url });
                return;
            }
        } catch (e) {
            if (e?.name === 'AbortError') return;
        }
        try {
            await navigator.clipboard.writeText(url);
            util.notify('Đã sao chép đường dẫn thiệp.').success();
        } catch {
            util.notify(url).info();
        }
    };

    const loadQr = () => document.querySelectorAll('img[data-qr]').forEach((img) => {
        if (img.getAttribute('src') !== img.getAttribute('data-qr')) {
            img.src = img.getAttribute('data-qr');
        }
    });

    // --- Lightbox: hiện ngay bản đang có trên trang, rồi đổi sang bản 2560px khi tải xong. ---
    /** @type {HTMLImageElement[]} */
    let group = [];
    let groupIndex = 0;
    let fullToken = 0;

    const showInModal = (img) => {
        const full = img.getAttribute('data-full') || img.currentSrc || img.src;
        const i = document.getElementById('show-modal-image');
        document.getElementById('button-modal-click').setAttribute('href', full);
        document.getElementById('button-modal-download').setAttribute('href', full);
        i.src = img.currentSrc || img.src;
        i.alt = img.alt;
        const token = ++fullToken;
        if (full !== i.src) {
            const pre = new Image();
            pre.decoding = 'async';
            pre.onload = () => {
                if (token === fullToken) {
                    i.src = full;
                }
            };
            pre.src = full;
        }
        const many = group.length > 1;
        ['lightbox-prev', 'lightbox-next', 'lightbox-count'].forEach((id) => document.getElementById(id).classList.toggle('d-none', !many));
        document.getElementById('lightbox-count').textContent = many ? `${groupIndex + 1} / ${group.length}` : '';
    };

    const modal = (img) => {
        const g = img.getAttribute('data-group');
        group = g ? Array.from(document.querySelectorAll(`img.js-zoom[data-group="${g}"]`)) : [img];
        groupIndex = Math.max(0, group.indexOf(img));
        showInModal(img);
        bs.modal('modal-image').show();
    };

    const step = (d) => {
        if (group.length < 2) {
            return;
        }
        groupIndex = (groupIndex + d + group.length) % group.length;
        showInModal(group[groupIndex]);
    };

    const wireEvents = () => {
        document.addEventListener('click', (e) => {
            const target = /** @type {HTMLElement} */ (e.target);
            const zoom = target.closest?.('.js-zoom');
            if (zoom && zoom.id !== 'show-modal-image') {
                modal(zoom);
                return;
            }
            const copyBtn = target.closest?.('.js-copy');
            if (copyBtn) {
                util.copy(copyBtn);
            }
        });

        const shown = document.getElementById('show-modal-image');
        shown.addEventListener('click', (e) => {
            const bar = e.currentTarget.parentNode.querySelector('.position-absolute');
            bar.classList.toggle('d-none');
            bar.classList.toggle('d-flex');
        });
        document.getElementById('lightbox-prev').addEventListener('click', () => step(-1));
        document.getElementById('lightbox-next').addEventListener('click', () => step(1));
        let touchX = null;
        shown.addEventListener('touchstart', (e) => {
            touchX = e.touches[0].clientX;
        }, { passive: true });
        shown.addEventListener('touchend', (e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            touchX = null;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }, { passive: true });
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('modal-image').classList.contains('show')) return;
            if (e.key === 'ArrowLeft') step(-1);
            if (e.key === 'ArrowRight') step(1);
        });
        document.addEventListener('hide.bs.modal', () => document.activeElement?.blur());

        document.getElementById('button-share')?.addEventListener('click', share);

        document.getElementById('album-more')?.addEventListener('click', (e) => {
            document.querySelectorAll('#album-grid .js-more').forEach((el) => el.classList.remove('d-none', 'js-more'));
            e.currentTarget.remove();
        });

        const giftBody = document.getElementById('gift-body');
        if (giftBody) {
            giftBody.addEventListener('show.bs.collapse', loadQr);
            if (giftBody.classList.contains('show')) {
                document.addEventListener('undangan.open', loadQr);
            }
        }

        document.getElementById('button-theme')?.addEventListener('click', () => theme.change());

        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => audio.toggle());
            audio.onChange((playing) => {
                musicToggle.replaceChildren(util.icon(playing ? 'fa-pause' : 'fa-play'));
                document.getElementById('music-disc')?.classList.toggle('spin-button', playing);
            });
        }
    };

    const open = (button) => {
        if (button) {
            button.disabled = true;
        }
        document.body.scrollIntoView({ behavior: 'instant' });
        document.getElementById('root').classList.remove('opacity-0');
        document.getElementById('button-theme').classList.remove('d-none');

        confetti.basicAnimation();
        util.timeOut(confetti.openAnimation, 1200);

        document.dispatchEvent(new Event('undangan.open'));
        theme.setStatusBar('--c-bg');

        const welcome = document.getElementById('welcome');
        if (welcome) {
            util.changeOpacity(welcome, false).then((el) => el.remove());
        }

        // Báo Google Sheet khách đã mở thiệp (một lần mỗi phiên).
        const opened = storage('session');
        if (ctx.code && !opened.get(`open:${ctx.code}`)) {
            opened.set(`open:${ctx.code}`, Date.now());
            client.open(ctx.code);
        }

        if (window.bootstrap?.ScrollSpy && document.getElementById('navbar-menu')) {
            window.bootstrap.ScrollSpy.getOrCreateInstance(document.body, { target: '#navbar-menu', rootMargin: '0px 0px -40%' });
        }
        util.timeOut(() => window.AOS?.refreshHard?.(), 300);
        wishesLoaded.then((list) => ticker.start(list));
        rsvpReminder();
    };

    const booting = async () => {
        const welcome = document.getElementById('welcome');
        if (welcome && (cfg.sections ?? []).includes('cover')) {
            // Bìa nằm ngay dưới màn tải (cùng nền xanh): hiện tức thì rồi chỉ làm mờ màn tải,
            // tránh lóe nền kem giữa hai màn.
            welcome.style.opacity = '1';
        } else {
            welcome?.remove();
            open(null);
        }
        await util.changeOpacity(document.getElementById('loading'), false).then((el) => el.remove());
    };

    const trackEagerImages = () => {
        document.querySelectorAll('img[loading="eager"]').forEach((img) => {
            progress.add();
            if (img.complete && img.naturalWidth > 0) {
                progress.complete('image');
                return;
            }
            img.addEventListener('load', () => progress.complete('image'), { once: true });
            img.addEventListener('error', () => progress.invalid('image'), { once: true });
        });
    };

    const domLoaded = async () => {
        theme.setStatusBar('--c-primary');
        offline.init();
        progress.init(10000);
        document.addEventListener('undangan.progress.done', booting, { once: true });

        const mark = ornament(cfg);
        if (mark) {
            document.getElementById('loading-mark')?.replaceChildren(mark);
        }

        progress.add(); // tra khách
        progress.add(); // thư viện AOS/confetti

        loader({ aos: true, confetti: true }).then(() => progress.complete('libs'));

        const [g, settings] = await Promise.all([resolveGuest(), loadSettings()]);
        applySettings(cfg, settings);
        // Bên của khách: theo Google Sheet, hoặc link theo nhà ?ben=nha-trai / ?ben=nha-gai
        const side = sideFromParam(g.guest?.side) || sideFromParam(new URLSearchParams(window.location.search).get('ben'));
        const events = visibleEvents(cfg.events, g.guest ?? (side ? { side, groups: [] } : null));
        ctx = {
            side,
            guest: g.guest,
            code: g.code, // mã khách gửi kèm RSVP / lời chúc / lượt mở ('' = link chung)
            khach: g.khach,
            guestNamePlain: g.plain,
            events,
            main: mainEvent(cfg.events, events),
            forms: { rsvp: f.rsvp, wishes: f.wishes },
        };

        const welcome = document.getElementById('welcome');
        welcome.replaceChildren(renderCover(cfg, ctx));
        welcome.querySelector('#button-open')?.addEventListener('click', (e) => open(e.currentTarget));

        const present = renderMain(cfg, ctx);
        renderNavbar(present);
        renderDesktopSide(cfg, ctx);
        if (client.isDemo) {
            console.info('[thiệp] Chế độ demo: chưa điền backend.appsScriptUrl, RSVP/lời chúc lưu trong localStorage.');
        }

        audio.init(cfg.music?.src);
        wireEvents();
        countDown();
        wishesLoaded = f.loadWishes();

        trackEagerImages();
        progress.complete('guest');
        progress.check();
    };

    const init = () => {
        theme.init();
        document.addEventListener('DOMContentLoaded', domLoaded);

        return {
            util,
            theme,
            audio,
            config: cfg,
            getContext: () => ctx,
        };
    };

    return {
        init,
    };
})();
