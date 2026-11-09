// Dựng nội dung thiệp từ wedding.config.js.
// Bản gốc dewanakl/undangan viết cứng mọi thứ trong index.html; ở đây mỗi phần trong
// config.sections được dựng bằng util.h() (mọi chuỗi đi qua textContent, không dùng innerHTML).
import { util } from '../../common/util.js';
import {
    eventDate, longDate, shortDate, timeText, weekday, dayNum, monthYear, calendarUrl, vietQrUrl, plainDate,
} from '../../common/format.js';
import { photoAttrs, COLUMN_SIZES } from '../../common/photo.js';

const { h, icon } = util;

const FAMILY_LABEL = { 'nha-trai': 'Nhà trai', 'nha-gai': 'Nhà gái' };

/** "Bác Hùng" — tránh lặp nếu tên đã có sẵn xưng hô ("Bác Hùng" + "Bác"). */
export const guestDisplay = (guest) => {
    if (!guest) {
        return 'Quý khách';
    }
    const name = String(guest.name ?? '').trim();
    const xh = String(guest.xungHo ?? '').trim();
    if (!xh || name.toLowerCase().startsWith(xh.toLowerCase() + ' ') || name.toLowerCase() === xh.toLowerCase()) {
        return name || xh || 'Quý khách';
    }
    return `${xh} ${name}`.trim();
};

/** Sự kiện khách được thấy: audience có "all", hoặc trùng side/groups của khách. */
export const visibleEvents = (events, guest) => (events ?? []).filter((ev) => {
    const aud = Array.isArray(ev.audience) && ev.audience.length ? ev.audience : ['all'];
    if (aud.includes('all')) {
        return true;
    }
    if (!guest) {
        return false;
    }
    const tags = [guest.side, ...(Array.isArray(guest.groups) ? guest.groups : [])].filter(Boolean);
    return aud.some((a) => tags.includes(a));
});

/** Sự kiện chính (cho bìa, đếm ngược): sự kiện "all" sớm nhất, nếu không có thì sự kiện thấy được sớm nhất. */
export const mainEvent = (events, visible) => {
    const byTime = (a, b) => (eventDate(a)?.getTime() ?? 0) - (eventDate(b)?.getTime() ?? 0);
    const all = [...visible].filter((e) => (e.audience ?? ['all']).includes('all')).sort(byTime);
    return all[0] ?? [...visible].sort(byTime)[0] ?? (events ?? [])[0] ?? null;
};

const fill = (text, khach) => String(text ?? '').split('{khach}').join(khach);

export const ornament = (cfg, small = false, large = false) => {
    const type = cfg.theme?.ornament ?? 'song-hy';
    if (type === 'none') {
        return null;
    }
    const cls = `ornament ${small ? 'ornament-sm' : ''} ${large ? 'ornament-lg' : ''}`;
    if (type === 'monogram') {
        const g = (cfg.couple.groom.shortName || cfg.couple.groom.fullName).trim()[0] ?? '';
        const b = (cfg.couple.bride.shortName || cfg.couple.bride.fullName).trim()[0] ?? '';
        return h('div', { class: `${cls} ornament-monogram`, 'aria-hidden': 'true' }, `${g}&${b}`);
    }
    return h('div', { class: `${cls} ornament-song-hy`, 'aria-hidden': 'true' }, '囍');
};

/**
 * Ảnh có srcset (mã ảnh pNN) hoặc src thường. Chạm để xem bản 2560px.
 * @param {string} ref
 * @param {string} alt
 * @param {string} cls
 * @param {{eager?: boolean, sizes?: string, zoom?: boolean, group?: string}} [opt]
 */
const img = (ref, alt, cls, opt = {}) => {
    if (!ref) {
        return null;
    }
    const zoom = opt.zoom !== false;
    return h('img', {
        ...photoAttrs(ref, opt.sizes ?? COLUMN_SIZES),
        alt: alt || 'Ảnh cưới',
        class: `${cls} ${zoom ? 'js-zoom cursor-pointer' : ''}`.trim(),
        loading: opt.eager ? 'eager' : 'lazy',
        fetchpriority: opt.eager ? 'high' : null,
        decoding: 'async',
        'data-group': opt.group ?? null,
    });
};

/** sizes cho ảnh cố định bề ngang theo rem. */
const fixedSizes = (rem) => `${Math.round(rem * 16)}px`;

const divider = () => h('div', { class: 'divider-ornament', 'aria-hidden': 'true' }, icon('fa-heart', 'fa-xs'));

// Như trang xem thử: mọi phần cùng nền kem, thẻ nền trắng (surface). `alt` giữ lại để tương thích, không đổi nền.
const sectionShell = (id, { kicker, title }, ...children) => h('section', { id, class: 'text-center bg-page' },
    kicker ? h('p', { class: 'section-kicker mb-1' }, kicker) : null,
    title ? h('h2', { class: 'section-title mb-0' }, title) : null,
    title ? divider() : null,
    ...children,
);

const coupleNames = (cfg) => `${cfg.couple.groom.shortName} & ${cfg.couple.bride.shortName}`;

// ---------------------------------------------------------------------------
// Từng phần
// ---------------------------------------------------------------------------

export const renderCover = (cfg, ctx) => {
    const main = ctx.main;
    const d = main ? eventDate(main) : null;
    // Bìa thư theo trang xem thử (preset Lục bảo): nền màu chính, 囍 vàng đồng, nút "Mở thiệp" nền vàng đồng.
    return h('div', { class: 'cover d-flex justify-content-center align-items-center overflow-y-auto px-3' },
        h('div', { class: 'd-flex flex-column text-center align-items-center py-4' },
            cfg.photos?.cover ? ornament(cfg) : ornament(cfg, false, true),
            h('p', { class: 'cover-small mt-3 mb-3' }, 'Thiệp mời cưới'),
            cfg.photos?.cover
                ? img(cfg.photos.cover, `Ảnh ${coupleNames(cfg)}`, 'cover-photo mb-3', { eager: true, zoom: false, sizes: fixedSizes(12) })
                : null,
            h('h1', { class: 'font-esthetic cover-names mb-1' }, coupleNames(cfg)),
            d ? h('p', { class: 'cover-date mb-3' }, shortDate(d)) : null,
            h('p', { class: 'cover-small mb-1' }, 'Kính mời'),
            h('p', { class: 'cover-guest mb-1', id: 'cover-guest' }, ctx.khach),
            h('p', { class: 'cover-small mb-4' }, 'đến dự lễ cưới của chúng mình'),
            h('button', { type: 'button', class: 'btn btn-cover rounded-pill px-4 py-2', id: 'button-open' },
                icon('fa-envelope-open', 'me-2'), 'Mở thiệp'),
        ),
    );
};

const renderHero = (cfg, ctx) => {
    const d = ctx.main ? eventDate(ctx.main) : null;
    return h('section', { id: 'home', class: 'bg-page text-center pt-5' },
        h('p', { class: 'section-kicker mb-2' }, 'Chúng mình cưới'),
        h('h1', { class: 'font-esthetic mb-4', style: { fontSize: '3.25rem', color: 'var(--c-strong)' } }, coupleNames(cfg)),
        h('div', { class: 'px-4' }, img(cfg.photos?.hero, `Ảnh cưới ${coupleNames(cfg)}`, 'hero-photo', { eager: true })),
        d ? h('p', { class: 'mt-4 mb-1 font-display', style: { fontSize: '1.15rem' } }, longDate(d)) : null,
        ctx.main?.lunar ? h('p', { class: 'text-muted-c small mb-3' }, `(${ctx.main.lunar})`) : null,
        ctx.main ? h('a', {
            class: 'btn btn-outline-auto btn-sm rounded-pill px-3 shadow-sm',
            href: calendarUrl(ctx.main, `Đám cưới ${coupleNames(cfg)}`, fill(cfg.texts?.invitation, ctx.khach)),
            target: '_blank',
            rel: 'noopener',
        }, icon('fa-calendar-plus', 'me-2'), 'Lưu vào Google Calendar') : null,
        h('div', { class: 'd-flex justify-content-center align-items-center mt-4 mb-1' },
            h('div', { class: 'mouse-animation border border-2 rounded-5 px-2 py-1 opacity-50', style: { borderColor: 'var(--c-muted)' } },
                h('div', { class: 'scroll-animation rounded-4', style: { backgroundColor: 'var(--c-muted)' } }))),
        h('p', { class: 'm-0 text-muted-c', style: { fontSize: '0.8rem' } }, 'Vuốt xuống'),
    );
};

const renderInvitation = (cfg, ctx) => h('section', { id: 'invitation', class: 'bg-page text-center statement' },
    cfg.photos?.statement ? h('img', { ...photoAttrs(cfg.photos.statement), alt: '', class: 'statement-bg', loading: 'lazy', decoding: 'async', 'aria-hidden': 'true' }) : null,
    h('div', { class: 'position-relative' },
        h('div', { class: 'd-flex justify-content-center mb-3' }, ornament(cfg, true)),
        cfg.texts?.quote ? h('p', { class: 'quote px-2 mb-0', 'data-aos': 'fade-up' }, `“${cfg.texts.quote}”`) : null,
        divider(),
        h('p', { class: 'px-2 mb-0', style: { fontSize: '1.05rem' }, 'data-aos': 'fade-up', id: 'invitation-text' }, fill(cfg.texts?.invitation, ctx.khach)),
    ),
);

const personCard = (p, role, side, aos) => h('div', { class: 'py-2', 'data-aos': aos },
    img(p.portrait, `${role} ${p.fullName}`, 'portrait mb-3 mx-auto d-block', { sizes: fixedSizes(11) }),
    h('p', { class: 'section-kicker mb-1' }, role),
    h('h3', { class: 'font-esthetic mb-2', style: { fontSize: '2.4rem', color: 'var(--c-strong)' } }, p.fullName),
    (p.father || p.mother) ? h('p', { class: 'mb-1 small' },
        h('span', { class: 'text-muted-c' }, `${FAMILY_LABEL[side]}: `),
        [p.father, p.mother].filter(Boolean).join(' & ')) : null,
    p.address ? h('p', { class: 'mb-2 small text-muted-c' }, icon('fa-location-dot', 'me-1'), p.address) : null,
    p.bio ? h('p', { class: 'mb-2 px-3' }, p.bio) : null,
    p.phone ? h('a', { class: 'btn btn-outline-auto btn-sm rounded-pill px-3', href: `tel:${String(p.phone).replace(/[^\d+]/g, '')}` },
        icon('fa-phone', 'me-2'), `Gọi ${role.toLowerCase()}`) : null,
);

const renderCouple = (cfg) => sectionShell('couple', { kicker: 'Cô dâu & chú rể', title: 'Chúng mình' },
    h('div', { class: 'overflow-hidden' },
        personCard(cfg.couple.groom, 'Chú rể', 'nha-trai', 'fade-right'),
        h('p', { class: 'font-esthetic my-3', style: { fontSize: '3.5rem', color: 'var(--c-accent)' } }, '&'),
        personCard(cfg.couple.bride, 'Cô dâu', 'nha-gai', 'fade-left'),
    ),
);

const eventCard = (cfg, ev, ctx) => {
    const d = eventDate(ev);
    return h('div', { class: 'card-c p-4 mb-4', 'data-aos': 'fade-up' },
        h('h3', { class: 'section-title mb-3', style: { fontSize: '1.35rem' } }, ev.name),
        d ? h('div', { class: 'd-flex justify-content-center align-items-center gap-3 mb-2' },
            h('div', { class: 'text-end small' }, h('div', null, weekday(d)), h('div', { class: 'text-muted-c' }, timeText(d))),
            h('div', { class: 'event-date-big px-3 border-start border-end border-accent' }, dayNum(d)),
            h('div', { class: 'text-start small' }, h('div', null, monthYear(d)))) : null,
        ev.lunar ? h('p', { class: 'small text-muted-c mb-3' }, `(${ev.lunar})`) : null,
        ev.venue ? h('p', { class: 'fw-semibold mb-1' }, ev.venue) : null,
        ev.address ? h('p', { class: 'small mb-3' }, icon('fa-location-dot', 'me-1 text-accent-c'), ev.address) : null,
        h('div', { class: 'd-flex flex-wrap justify-content-center gap-2' },
            ev.mapsUrl ? h('a', { class: 'btn btn-primary btn-sm rounded-pill px-3', href: ev.mapsUrl, target: '_blank', rel: 'noopener' },
                icon('fa-map-location-dot', 'me-2'), 'Chỉ đường') : null,
            d ? h('a', {
                class: 'btn btn-outline-auto btn-sm rounded-pill px-3',
                href: calendarUrl(ev, `${ev.name} - ${coupleNames(cfg)}`, fill(cfg.texts?.invitation, ctx.khach)),
                target: '_blank',
                rel: 'noopener',
            }, icon('fa-calendar-plus', 'me-2'), 'Lưu lịch') : null,
        ),
    );
};

const renderEvents = (cfg, ctx) => sectionShell('events', { kicker: 'Thời gian & địa điểm', title: 'Sự kiện cưới' },
    ctx.events.length
        ? ctx.events.map((ev) => eventCard(cfg, ev, ctx))
        : h('p', { class: 'text-muted-c' }, 'Thông tin sự kiện sẽ được cập nhật sớm.'),
);

const renderSchedule = (cfg) => {
    const items = cfg.schedule ?? [];
    if (!items.length) {
        return null;
    }
    return sectionShell('schedule', { kicker: 'Lịch trình', title: 'Ngày vui của chúng mình', alt: true },
        h('div', { class: 'timeline text-start', 'data-aos': 'fade-up' },
            items.map((it) => h('div', { class: 'timeline-item' },
                h('div', { class: 'timeline-time' }, it.time),
                h('div', { class: 'timeline-icon' }, icon(/^fa-/.test(it.icon ?? '') ? it.icon : 'fa-heart')),
                h('div', { class: 'flex-grow-1' }, it.title),
            )),
        ),
    );
};

const renderCountdown = (cfg, ctx) => {
    if (!ctx.main || !eventDate(ctx.main)) {
        return null;
    }
    const box = (id, label) => h('div', { class: 'col-3 px-1' },
        h('div', { class: 'countdown-box' }, h('div', { class: 'countdown-num', id }, '00'), h('div', { class: 'countdown-label' }, label)));
    return sectionShell('countdown', { kicker: 'Đếm ngược', title: 'Còn bao lâu nữa?' },
        h('div', { class: 'row justify-content-center mx-0', id: 'countdown-boxes' },
            box('day', 'Ngày'), box('hour', 'Giờ'), box('minute', 'Phút'), box('second', 'Giây')),
        h('p', { class: 'mt-3 mb-0 text-muted-c small', id: 'countdown-note' }, `đến ${ctx.main.name} · ${longDate(eventDate(ctx.main))}`),
    );
};

const ALBUM_FIRST = 12;
// sizes cho ô lưới 3 cột trong cột thiệp.
const GRID_SIZES = '(min-width: 1400px) 9vw, (min-width: 1200px) 11vw, (min-width: 992px) 14vw, (min-width: 768px) 17vw, (min-width: 576px) 20vw, 34vw';

/** Album: lưới 3 cột, hiện 12 ảnh đầu, nút "Xem thêm"; chạm ảnh mở lightbox có nút trước/sau. */
const renderAlbum = (cfg) => {
    const list = [];
    for (const l of cfg.album?.leaves ?? []) {
        if (l.front) list.push({ src: l.front, alt: l.frontAlt });
        if (l.back) list.push({ src: l.back, alt: l.backAlt });
    }
    if (!list.length) {
        return null;
    }
    const cell = (p, i) => h('div', { class: `album-cell ${i >= ALBUM_FIRST ? 'd-none js-more' : ''}` },
        img(p.src, p.alt || `Ảnh cưới ${i + 1}`, 'album-img', { sizes: GRID_SIZES, group: 'album' }));
    const more = list.length > ALBUM_FIRST
        ? h('button', { type: 'button', class: 'btn btn-outline-auto rounded-pill px-4 mt-3', id: 'album-more' },
            icon('fa-images', 'me-2'), `Xem thêm ${list.length - ALBUM_FIRST} ảnh`)
        : null;
    return sectionShell('album', { kicker: cfg.album?.kicker || 'Khoảnh khắc', title: cfg.album?.title || 'Album ảnh cưới' },
        h('div', { class: 'album-grid', id: 'album-grid' }, list.map(cell)),
        more,
        h('p', { class: 'small text-muted-c mt-2 mb-0' }, 'Chạm vào ảnh để xem lớn, vuốt để xem ảnh khác'),
    );
};

const renderMusic = (cfg) => {
    if (!cfg.music?.src) {
        return null;
    }
    return sectionShell('music', { kicker: 'Bài hát của chúng mình', title: null },
        h('div', { class: 'card-c d-flex align-items-center gap-3 p-3 text-start mt-2' },
            h('div', { class: 'music-disc spin-button flex-shrink-0', id: 'music-disc' }),
            h('div', { class: 'flex-grow-1' },
                h('div', { class: 'fw-semibold' }, cfg.music.title || 'Nhạc nền'),
                cfg.music.artist ? h('div', { class: 'small text-muted-c' }, cfg.music.artist) : null),
            h('button', { type: 'button', class: 'btn btn-primary rounded-circle', id: 'music-toggle', 'aria-label': 'Bật/tắt nhạc', style: { width: '2.75rem', height: '2.75rem' } },
                icon('fa-pause')),
        ),
    );
};

const accountCard = (acc, ctx) => {
    const info = `Mung cuoi ${ctx.guestNamePlain || ''}`.trim();
    const qrSrc = acc.qrImage || vietQrUrl(acc, info);
    return h('div', { class: 'card-c p-3 mb-3 text-start' },
        h('p', { class: 'fw-semibold mb-1' }, icon('fa-user', 'me-2 text-accent-c'), acc.owner || acc.accountName),
        h('p', { class: 'small mb-1' }, icon('fa-building-columns', 'me-2 text-accent-c'), acc.bankName),
        h('div', { class: 'd-flex justify-content-between align-items-center gap-2 mb-1' },
            h('span', { class: 'account-no' }, acc.accountNo),
            h('button', {
                type: 'button', class: 'btn btn-outline-auto btn-sm rounded-pill py-0 px-2 js-copy', 'data-copy': String(acc.accountNo ?? '').replace(/\s/g, ''),
                'aria-label': 'Chép số tài khoản',
            }, icon('fa-copy', 'me-1'), 'Chép')),
        acc.accountName ? h('p', { class: 'small text-muted-c mb-2' }, acc.accountName) : null,
        h('div', { class: 'text-center' },
            h('img', { 'data-qr': qrSrc, src: 'data:,', alt: `Mã QR chuyển khoản ${acc.bankName} ${acc.accountNo}`, class: 'qr-img js-zoom cursor-pointer', loading: 'lazy' }),
            h('p', { class: 'small text-muted-c mt-1 mb-0' }, 'Quét bằng app ngân hàng bất kỳ')),
    );
};

const renderGifts = (cfg, ctx) => {
    const accounts = cfg.gifts?.accounts ?? [];
    if (!accounts.length) {
        return null;
    }
    const order = ctx.guest?.side === 'nha-gai' ? ['nha-gai', 'nha-trai'] : ['nha-trai', 'nha-gai'];
    const families = [...new Set([...order, ...accounts.map((a) => a.family)])];
    const collapsed = cfg.gifts?.collapsed !== false;
    const body = h('div', { id: 'gift-body', class: collapsed ? 'collapse' : 'collapse show' },
        h('div', { class: 'pt-3' },
            families.map((f) => {
                const list = accounts.filter((a) => a.family === f);
                if (!list.length) return null;
                return h('div', { class: 'mb-2' },
                    h('p', { class: 'section-kicker mb-2' }, FAMILY_LABEL[f] ?? f),
                    list.map((a) => accountCard(a, ctx)));
            })));
    return sectionShell('gifts', { kicker: 'Mừng cưới', title: 'Gửi quà yêu thương', alt: true },
        h('p', { class: 'px-2' }, 'Sự hiện diện của bạn là món quà quý nhất. Nếu muốn gửi quà mừng từ xa, bạn có thể chuyển khoản qua thông tin dưới đây.'),
        collapsed ? h('button', {
            type: 'button', class: 'btn btn-outline-auto rounded-pill px-3', 'data-bs-toggle': 'collapse', 'data-bs-target': '#gift-body',
            'aria-expanded': 'false', 'aria-controls': 'gift-body', id: 'gift-toggle',
        }, icon('fa-gift', 'me-2'), 'Xem thông tin mừng cưới') : null,
        body,
    );
};

const renderEnding = (cfg, ctx) => h('section', { id: 'ending', class: 'bg-page text-center pb-5' },
    img(cfg.photos?.ending, `Ảnh cưới ${coupleNames(cfg)}`, 'hero-photo mb-4'),
    h('p', { class: 'px-2', style: { fontSize: '1.05rem' }, id: 'thank-you-text' }, fill(cfg.texts?.thankYou, ctx.khach)),
    h('h2', { class: 'font-esthetic my-3', style: { fontSize: '3rem', color: 'var(--c-strong)' } }, coupleNames(cfg)),
    h('div', { class: 'd-flex justify-content-center' }, ornament(cfg, true)),
    h('hr', { class: 'my-4', style: { borderColor: 'var(--c-line)' } }),
    h('p', { class: 'footer-credit mb-0' },
        'Thiệp dựa trên mẫu mã nguồn mở ',
        h('a', { href: 'https://github.com/dewanakl/undangan', target: '_blank', rel: 'noopener' }, 'undangan'),
        ' của dewanakl (MIT)'),
);

const NAV = [
    ['hero', '#home', 'fa-house', 'Trang đầu'],
    ['couple', '#couple', 'fa-user-group', 'Chúng mình'],
    ['events', '#events', 'fa-calendar-check', 'Sự kiện'],
    ['album', '#album', 'fa-images', 'Album'],
    ['rsvp', '#rsvp', 'fa-envelope-circle-check', 'Xác nhận'],
    ['wishes', '#wishes', 'fa-comments', 'Lời chúc'],
];

const NAV_PRIORITY = ['hero', 'events', 'rsvp', 'wishes', 'couple', 'album'];

export const renderNavbar = (present) => {
    const list = document.getElementById('navbar-list');
    // Tối đa 5 mục cho vừa màn hình điện thoại; ưu tiên theo NAV_PRIORITY, hiển thị theo thứ tự trang.
    const keep = new Set(NAV_PRIORITY.filter((k) => present.has(k)).slice(0, 5));
    const items = NAV.filter(([k]) => keep.has(k));
    if (items.length < 2) {
        document.getElementById('navbar-menu')?.remove();
        return;
    }
    list.replaceChildren(...items.map(([, href, ic, label]) => h('li', { class: 'nav-item' },
        h('a', { class: 'nav-link', href }, icon(ic), h('span', { class: 'd-block', style: { fontSize: '0.68rem' } }, label)))));
};

export const renderDesktopSide = (cfg, ctx) => {
    const side = document.getElementById('desktop-side');
    const d = ctx.main ? eventDate(ctx.main) : null;
    side.replaceChildren(
        cfg.photos?.hero ? h('img', { ...photoAttrs(cfg.photos.hero, '75vw'), alt: '', class: 'position-absolute bg-cover-home', style: { opacity: '0.3' }, loading: 'lazy', decoding: 'async', 'aria-hidden': 'true' }) : null,
        h('div', { class: 'position-relative text-center p-4 bg-overlay-auto rounded-5' },
            h('div', { class: 'd-flex justify-content-center mb-2' }, ornament(cfg, true)),
            h('h2', { class: 'font-esthetic mb-3', style: { fontSize: '3rem', color: 'var(--c-strong)' } }, coupleNames(cfg)),
            d ? h('p', { class: 'm-0' }, longDate(d)) : null),
    );
};

/**
 * Dựng toàn bộ <main> theo thứ tự config.sections.
 * @param {object} cfg
 * @param {object} ctx { guest, khach, events, main, forms: {rsvp: fn, wishes: fn} }
 * @returns {Set<string>} các phần đã dựng
 */
export const renderMain = (cfg, ctx) => {
    const builders = {
        hero: renderHero,
        invitation: renderInvitation,
        couple: renderCouple,
        events: renderEvents,
        schedule: renderSchedule,
        countdown: renderCountdown,
        album: renderAlbum,
        music: renderMusic,
        gifts: renderGifts,
        rsvp: ctx.forms.rsvp,
        wishes: ctx.forms.wishes,
        ending: renderEnding,
    };
    // Ảnh chèn giữa: lần lượt đặt sau các phần này (nếu có).
    const breakAfter = ['couple', 'countdown', 'gifts', 'schedule'];
    const middle = [...(cfg.photos?.middle ?? [])];

    const main = document.getElementById('main');
    const present = new Set();
    const nodes = [];
    for (const key of cfg.sections ?? []) {
        const fn = builders[key];
        if (!fn) {
            continue;
        }
        const node = fn(cfg, ctx);
        if (!node) {
            continue;
        }
        present.add(key);
        nodes.push(node);
        if (breakAfter.includes(key) && middle.length) {
            const src = middle.shift();
            nodes.push(h('div', { class: 'bg-page' }, img(src, 'Ảnh cưới', 'photo-break')));
        }
    }
    main.replaceChildren(...nodes);
    return present;
};

export { plainDate };
