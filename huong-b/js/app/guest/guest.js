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

// Tra khách theo ?to=: đo trên Web App thật (25/11/2026, 122 mã) — giữa 2,3 giây, 90% dưới 3,3 giây, nhưng có
// lượt 6–23 giây hoặc treo hẳn (chậm riêng từng lượt). Không tra được thì thiệp không biết khách nhà trai hay nhà
// gái và phải hiện thông tin chung của cả hai nhà. Nên: chờ lượt 1 tới 4,5 giây; chưa có trả lời thì gửi thêm
// lượt 2 song song và nhận trả lời nào về trước, chờ thêm tối đa 10,5 giây. Vẫn không được thì dùng thông tin
// khách đã lưu trên máy này từ lần mở trước.
const LOOKUP_WAIT_MS = [4500, 10500];
// Link đã cho biết nhà (?t= / ?g= / ?c=): Sheet trả lời trong 2,5 giây (phần lớn lượt tra) thì dùng thông tin Sheet,
// không thì mở luôn theo link — khách không phải chờ, và không bao giờ thấy thông tin của cả hai nhà.
const QUICK_WAIT_MS = 2500;
/** Tên tham số mã khách → nhà của khách (link ngắn: ?t=mã / ?g=mã / ?c=mã). */
const LINK_SIDE = { t: 'nha-trai', g: 'nha-gai', c: 'ban-chung' };
const SETTINGS_WAIT_MS = [3000, 3000];
const LOADING_MAX_MS = 10000; // màn tải tối đa với link chung
const LOADING_MAX_GUEST_MS = 17000; // link có mã khách: đủ thời gian cho 2 lần tra

/** Trả lời đầu tiên có success trong các lần gọi; quá `ms` hoặc mọi lần gọi đều lỗi → null. */
const firstAnswer = (promises, ms) => new Promise((resolve) => {
    let left = promises.length;
    let done = false;
    const finish = (v) => {
        if (!done) {
            done = true;
            clearTimeout(timer);
            resolve(v);
        }
    };
    const timer = setTimeout(() => finish(null), ms);
    const miss = () => {
        left -= 1;
        if (left === 0) finish(null);
    };
    promises.forEach((p) => p.then((res) => (res?.success ? finish(res) : miss()), miss));
});

export const guest = (() => {

    const cfg = config;
    const client = appsScript(cfg.backend?.appsScriptUrl);
    const f = forms(client);
    const ticker = wishTicker();
    let wishesLoaded = Promise.resolve([]);

    /**
     * Giờ sự kiện / tài khoản mừng cưới / lời trên thiệp từ Google Sheet. Đo trên trang thật: 2/12 lượt quá 4 giây
     * (khi đó mục mừng cưới bị ẩn). Nên: chờ 3 giây, chưa có thì gửi thêm lượt 2 song song, tổng tối đa 6 giây;
     * vẫn không được thì dùng bản đã lưu trên máy từ lần mở trước, cuối cùng mới dùng wedding.config.js.
     */
    const loadSettings = async () => {
        const remembered = storage('settings');
        const calls = [client.settings()];
        let res = await firstAnswer(calls, SETTINGS_WAIT_MS[0]);
        if (!res) {
            calls.push(client.settings(2));
            res = await firstAnswer(calls, SETTINGS_WAIT_MS[1]);
        }
        if (res) {
            if (res.data) {
                remembered.set('last', { data: res.data, at: Date.now() });
            }
            return res.data ?? null;
        }
        const cached = remembered.get('last')?.data ?? null;
        console.warn(`[thiệp] không tải được cấu hình từ Sheet, dùng ${cached ? 'bản đã lưu từ lần mở trước' : 'wedding.config.js'}.`);
        return cached;
    };

    /** @type {object} */
    let ctx = null;

    /** Xong khi phần nội dung (sau bìa thư) đã dựng — sau khi có cấu hình Sheet. */
    let mainReady = Promise.resolve();

    /**
     * Đọc link mời. Mã khách nằm ở tham số mà TÊN tham số cho biết luôn nhà của khách (link ngắn, không lộ chữ):
     *   ?t=mã → nhà trai · ?g=mã → nhà gái · ?c=mã → bạn chung · ?to=mã → chưa rõ nhà (link cũ, tra Sheet)
     * Link chung theo nhà: ?t / ?g (không mã), hoặc dạng cũ ?ben=nha-trai / ?ben=nha-gai.
     * &n= là tên có dấu (dấu cách viết "+"), dùng khi chưa tra được Sheet.
     */
    const readLink = () => {
        const params = new URLSearchParams(window.location.search);
        let raw = (params.get('to') ?? '').trim();
        let linkSide = '';
        for (const [k, s] of Object.entries(LINK_SIDE)) {
            if (params.has(k)) {
                linkSide = linkSide || s;
                raw = raw || (params.get(k) ?? '').trim();
            }
        }
        const ben = String(params.get('ben') ?? '').trim().toLowerCase();
        if (!linkSide && Object.values(LINK_SIDE).includes(ben)) {
            linkSide = ben;
        }
        const name = (params.get('n') ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
        return { raw: raw.slice(0, 80), linkSide, name };
    };

    /** Đọc link và tra khách. Không tìm thấy mà trông giống tên người → dùng làm tên hiển thị. */
    const resolveGuest = async () => {
        const { raw, linkSide, name: nameFromLink } = readLink();
        if (!raw) {
            return nameFromLink ? { guest: null, code: '', khach: nameFromLink, plain: nameFromLink } : { guest: null, code: '', khach: 'Quý vị', plain: '' };
        }

        // Thông tin khách đã tra được ở lần mở trước trên máy này (theo mã) — dùng khi Sheet không trả lời.
        const remembered = storage('guests');
        const key = raw.toLowerCase();
        const keepLate = (calls) => firstAnswer(calls, LOOKUP_WAIT_MS[1]).then((late) => {
            if (late?.found && late.data) remembered.set(key, { data: late.data, at: Date.now() });
        });

        const calls = [client.lookup(raw)];
        // Link đã cho biết nhà (?t= / ?g= / ?c=): chỉ chờ Sheet một lúc ngắn — không kịp thì mở luôn theo link
        let res = await firstAnswer(calls, linkSide ? QUICK_WAIT_MS : LOOKUP_WAIT_MS[0]);
        if (!res) {
            console.warn('[thiệp] tra khách chậm / lỗi, thử lại…');
            calls.push(client.lookup(raw, 2));
            if (linkSide || remembered.get(key)?.data) {
                // Đã biết nhà (từ link, hoặc thông tin lưu từ lần mở trước): không bắt khách chờ thêm;
                // lượt tra vẫn chạy nền để lưu thông tin Sheet cho lần mở sau.
                keepLate(calls);
            } else {
                res = await firstAnswer(calls, LOOKUP_WAIT_MS[1]);
            }
        }

        let found = null;
        const unanswered = !res; // Sheet lỗi / quá chậm (khác với "không có mã này")
        if (res?.found && res.data) {
            found = res.data;
            remembered.set(key, { data: found, at: Date.now() });
        } else if (unanswered && remembered.get(key)?.data) {
            found = remembered.get(key).data;
            console.warn('[thiệp] không tra được khách, dùng thông tin đã lưu từ lần mở trước.');
        } else if (unanswered) {
            console.warn('[thiệp] không tra được khách (Sheet không trả lời).');
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
                boxes.replaceChildren(util.h('p', { class: 'quote m-0' }, sameDay ? 'Hôm nay là ngày vui của chúng tôi!' : `Xin chân thành cảm ơn ${ctx.khach} đã chung vui cùng chúng tôi!`));
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
        let done = !!f.lastRsvp(ctx.code ?? ''); // chỉ tính xác nhận của đúng link mời này
        let inView = false;
        let armed = false;
        // "2026-12-02" → "02/12" (đọc thẳng từ chuỗi, không qua Date nên không lệch múi giờ)
        const dl = /^\d{4}-(\d{2})-(\d{2})$/.exec(String(cfg.backend?.rsvpDeadline ?? '').trim());
        const late = dl && Date.now() > new Date(`${dl[0]}T23:59:59+07:00`).getTime();
        const sub = dl && !late ? `Xin vui lòng phản hồi trước ${dl[2]}/${dl[1]}` : 'Để chúng tôi chuẩn bị chu đáo';
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
        // Link chung theo nhà, dạng ngắn: ?t (nhà trai) / ?g (nhà gái)
        const short = Object.keys(LINK_SIDE).find((k) => LINK_SIDE[k] === ctx.side);
        const url = `${window.location.origin}${window.location.pathname}${short ? `?${short}` : ''}`;
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
        if (!window.bootstrap?.Modal) {
            // Thư viện Bootstrap (jsDelivr) không tải được: mở ảnh lớn ở tab mới thay vì báo lỗi
            window.open(img.getAttribute('data-full') || img.currentSrc || img.src, '_blank', 'noopener');
            return;
        }
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
        let touchY = null;
        shown.addEventListener('touchstart', (e) => {
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        }, { passive: true });
        // Vuốt ngang để đổi ảnh: chặn trình duyệt hiểu thành cử chỉ "quay lại trang trước" (thoát khỏi thiệp)
        shown.addEventListener('touchmove', (e) => {
            if (touchX === null || e.touches.length > 1) return;
            const dx = e.touches[0].clientX - touchX;
            const dy = e.touches[0].clientY - touchY;
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) e.preventDefault();
        }, { passive: false });
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

        // Thanh điều hướng: cuộn tới mục mà không thêm "#muc" vào địa chỉ — nút Quay lại của điện thoại không
        // phải bấm qua từng mục, và địa chỉ thiệp (có mã khách) giữ nguyên khi khách sao chép.
        document.getElementById('navbar-list')?.addEventListener('click', (e) => {
            const a = /** @type {HTMLElement} */ (e.target).closest?.('a[href^="#"]');
            const el = a && document.querySelector(a.getAttribute('href'));
            if (!el) return;
            e.preventDefault();
            const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });

        document.getElementById('album-more')?.addEventListener('click', (e) => {
            document.querySelectorAll('#album-grid .js-more').forEach((el) => el.classList.remove('d-none', 'js-more'));
            e.currentTarget.remove();
        });

        const giftBody = document.getElementById('gift-body');
        if (giftBody) {
            giftBody.addEventListener('show.bs.collapse', loadQr);
            // Bootstrap không tải được: nút "Xem thông tin mừng cưới" tự mở / đóng phần tài khoản
            document.getElementById('gift-toggle')?.addEventListener('click', (e) => {
                if (window.bootstrap?.Collapse) return;
                const opening = !giftBody.classList.contains('show');
                giftBody.classList.toggle('show', opening);
                e.currentTarget.setAttribute('aria-expanded', String(opening));
                if (opening) loadQr();
            });
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
            // Gắn vào <html> (không phải <body>): body có overflow-x: hidden nên Bootstrap tưởng body là khung
            // cuộn riêng (mà body không cuộn) → mục sáng trên thanh điều hướng không bao giờ đổi.
            window.bootstrap.ScrollSpy.getOrCreateInstance(document.documentElement, { target: '#navbar-menu', rootMargin: '0px 0px -40%' });
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
            mainReady.then(() => open(null));
        }
        await util.changeOpacity(document.getElementById('loading'), false).then((el) => el.remove());
    };

    // Màn tải chỉ chờ ảnh trên bìa thư (thứ khách thấy đầu tiên). Ảnh đầu thiệp nằm sau bìa vẫn tải ngay
    // nhưng không bắt khách chờ — đo trên mạng 4G: bỏ chờ ảnh này giúp bìa hiện sớm hơn ~3 giây.
    const trackEagerImages = () => {
        document.querySelectorAll('#welcome img[loading="eager"]').forEach((img) => {
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
        const hasGuestCode = !!readLink().raw;
        progress.init(hasGuestCode ? LOADING_MAX_GUEST_MS : LOADING_MAX_MS);
        document.addEventListener('undangan.progress.done', booting, { once: true });

        const mark = ornament(cfg);
        if (mark) {
            document.getElementById('loading-mark')?.replaceChildren(mark);
        }

        progress.add(); // tra khách
        progress.add(); // thư viện AOS/confetti

        loader({ aos: true, confetti: true }).then(() => progress.complete('libs'));

        // Tra khách và cấu hình Sheet chạy song song. Bìa thư chỉ cần biết khách (tên, nhà) — không cần giờ sự kiện
        // hay tài khoản — nên dựng ngay khi tra khách xong, không chờ cấu hình (đo trên 4G: cấu hình mất 1,4–2,8 giây).
        // Phần nội dung bên trong (giờ, mừng cưới, lời) vẫn chờ cấu hình như trước, dựng sau lưng bìa thư.
        const guestP = resolveGuest();
        const settingsP = loadSettings();
        const g = await guestP;
        // Nhà của khách: theo Google Sheet (chuẩn); Sheet không ghi / chưa tra được thì theo link
        // (?t= / ?g= / ?c=, hoặc ?ben=). side = nhà trai / nhà gái (lời mời, thứ tự tên); "ban-chung" chỉ dùng lọc sự kiện.
        const { linkSide } = readLink();
        const sheetSide = String(g.guest?.side ?? '');
        const whoSide = sheetSide || linkSide;
        const side = sideFromParam(whoSide);
        const buildCtx = () => {
            const who = g.guest ? { ...g.guest, side: whoSide } : (whoSide ? { side: whoSide, groups: [] } : null);
            const events = visibleEvents(cfg.events, who);
            return {
                side,
                guest: g.guest,
                code: g.code, // mã khách gửi kèm RSVP / lời chúc / lượt mở ('' = link chung)
                khach: g.khach,
                guestNamePlain: g.plain,
                events,
                main: mainEvent(cfg.events, events),
                forms: { rsvp: f.rsvp, wishes: f.wishes },
            };
        };
        ctx = buildCtx();

        audio.init(cfg.music?.src);
        const welcome = document.getElementById('welcome');
        welcome.replaceChildren(renderCover(cfg, ctx));

        mainReady = (async () => {
            const settings = await settingsP;
            try {
                applySettings(cfg, settings);
            } catch (e) {
                // Dữ liệu cấu hình lạ từ Sheet không được làm hỏng thiệp: bỏ qua, dùng wedding.config.js
                console.warn('[thiệp] cấu hình từ Sheet không hợp lệ, dùng wedding.config.js:', e.message);
            }
            ctx = buildCtx(); // giờ từ Sheet có thể đổi thứ tự / sự kiện chính
            try {
                const present = renderMain(cfg, ctx);
                renderNavbar(present);
                renderDesktopSide(cfg, ctx);
                offline.refresh();
            } catch (e) {
                // Bìa thư đã dựng xong: lỗi ở phần nội dung không được làm thiệp trắng màn hình
                console.error('[thiệp] lỗi dựng nội dung:', e);
            }
            if (client.isDemo) {
                console.info('[thiệp] Chế độ demo: chưa điền backend.appsScriptUrl, RSVP/lời chúc lưu trong localStorage.');
            }
            wireEvents();
            countDown();
            wishesLoaded = f.loadWishes();
        })();

        welcome.querySelector('#button-open')?.addEventListener('click', async (e) => {
            const btn = /** @type {HTMLButtonElement} */ (e.currentTarget);
            if (btn.disabled) return;
            btn.disabled = true;
            audio.play(); // bật nhạc ngay trong cú chạm (trình duyệt chỉ cho phát nhạc theo thao tác của khách)
            const slow = setTimeout(() => btn.replaceChildren(util.icon('fa-spinner', 'fa-spin me-2'), 'Đang mở thiệp...'), 400);
            await mainReady; // nội dung thường đã sẵn; Sheet chậm thì chờ thêm vài giây
            clearTimeout(slow);
            open(btn);
        });

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
