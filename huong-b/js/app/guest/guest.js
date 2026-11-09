// Điều phối trang khách — dựa trên js/app/guest/guest.js của dewanakl/undangan v3.14.0
// (màn tải → bìa thư → "Mở thiệp" bật nhạc + confetti → nội dung, đếm ngược, modal ảnh, nút sáng/tối).
// Khác bản gốc: nội dung dựng từ wedding.config.js, tên khách tra qua Apps Script theo ?to=,
// sự kiện lọc theo nhóm khách, RSVP + lời chúc thay cho bình luận PHP.
import config from '../../../wedding.config.js';
import { audio } from './audio.js';
import { progress } from './progress.js';
import { forms } from './forms.js';
import {
    renderCover, renderMain, renderNavbar, renderDesktopSide, guestDisplay, visibleEvents, mainEvent, ornament,
} from './render.js';
import { util } from '../../common/util.js';
import { theme } from '../../common/theme.js';
import { offline } from '../../common/offline.js';
import { storage } from '../../common/storage.js';
import { eventDate } from '../../common/format.js';
import { appsScript } from '../../connection/apps-script.js';
import { bs } from '../../libs/bootstrap.js';
import { loader } from '../../libs/loader.js';
import * as confetti from '../../libs/confetti.js';

const LOOKUP_TIMEOUT_MS = 6000;

export const guest = (() => {

    const cfg = config;
    const client = appsScript(cfg.backend?.appsScriptUrl);
    const f = forms(client);

    /** @type {object} */
    let ctx = null;

    /** Đọc ?to= và tra khách. Không tìm thấy mà trông giống tên người → dùng làm tên hiển thị. */
    const resolveGuest = async () => {
        const raw = (new URLSearchParams(window.location.search).get('to') ?? '').trim().slice(0, 80);
        if (!raw) {
            return { guest: null, khach: 'Quý khách', plain: '' };
        }

        let found = null;
        try {
            const res = await Promise.race([
                client.lookup(raw),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), LOOKUP_TIMEOUT_MS)),
            ]);
            if (res?.success && res.found && res.data) {
                found = res.data;
            }
        } catch (e) {
            console.warn('[thiệp] không tra được khách:', e.message);
        }

        if (found) {
            const khach = guestDisplay(found);
            return { guest: found, khach, plain: khach };
        }
        const looksLikeName = /\s/.test(raw) || /[^a-z0-9_-]/i.test(raw);
        return looksLikeName ? { guest: null, khach: raw, plain: raw } : { guest: null, khach: 'Quý khách', plain: '' };
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
                boxes.replaceChildren(util.h('p', { class: 'quote m-0' }, sameDay ? 'Hôm nay là ngày vui của chúng mình!' : 'Cảm ơn mọi người đã chung vui cùng chúng mình!'));
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
        if (ctx.guest?.code && !opened.get(`open:${ctx.guest.code}`)) {
            opened.set(`open:${ctx.guest.code}`, Date.now());
            client.open(ctx.guest.code);
        }

        if (window.bootstrap?.ScrollSpy && document.getElementById('navbar-menu')) {
            window.bootstrap.ScrollSpy.getOrCreateInstance(document.body, { target: '#navbar-menu', rootMargin: '0px 0px -40%' });
        }
        util.timeOut(() => window.AOS?.refreshHard?.(), 300);
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

        const g = await resolveGuest();
        const events = visibleEvents(cfg.events, g.guest);
        ctx = {
            guest: g.guest,
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
        f.loadWishes();

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
