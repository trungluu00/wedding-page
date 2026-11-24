// Lời chúc hiện nhẹ khi khách mở thiệp: lần lượt từng lời chúc (thẻ nhỏ trên đầu cột nội dung),
// bấm vào để tới sổ lưu bút, bấm × để tắt. Tạm dừng khi tab ẩn, đang mở modal, hoặc đang xem sổ lưu bút.
import { util } from '../../common/util.js';

const FIRST_DELAY_MS = 3000;
const SHOW_MS = 5000;
const GAP_MS = 6000; // nghỉ giữa hai lời chúc để không che tiêu đề các mục quá lâu
const MAX_ITEMS = 8;

export const wishTicker = () => {
    const { h, icon } = util;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let zone = null;
    let timer = null;
    let stopped = false;
    let list = [];
    let shown = 0;
    let guestbookVisible = false;

    const stop = () => {
        stopped = true;
        clearTimeout(timer);
        zone?.remove();
        zone = null;
    };

    const paused = () => document.hidden || guestbookVisible || !!document.querySelector('.modal.show');

    const show = () => {
        if (stopped || !zone) {
            return;
        }
        if (shown >= Math.min(MAX_ITEMS, list.length)) {
            stop();
            return;
        }
        if (paused()) {
            timer = setTimeout(show, GAP_MS);
            return;
        }
        const w = list[shown++];
        const close = h('button', {
            type: 'button',
            class: 'wish-ticker-close',
            'aria-label': 'Tắt lời chúc',
            onclick: (e) => {
                e.stopPropagation();
                stop();
            },
        }, icon('fa-xmark'));
        const card = h('div', {
            class: 'wish-ticker-card',
            onclick: () => document.getElementById('wishes')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }),
        },
        h('span', { class: 'wish-ticker-icon' }, icon('fa-heart')),
        h('div', { class: 'wish-ticker-body' },
            h('p', { class: 'wish-ticker-author' }, w.author, w.relation ? h('span', { class: 'wish-ticker-rel' }, ` · ${w.relation}`) : null),
            h('p', { class: 'wish-ticker-text' }, w.text)),
        close);
        zone.replaceChildren(card);
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('is-in')));
        timer = setTimeout(() => {
            card.classList.remove('is-in');
            timer = setTimeout(show, reduceMotion ? GAP_MS : GAP_MS + 400);
        }, SHOW_MS);
    };

    /**
     * @param {Array<{author: string, relation?: string, text: string}>} wishes
     */
    const start = (wishes) => {
        const book = document.getElementById('wishes');
        const col = document.getElementById('main')?.parentElement;
        list = (wishes ?? []).filter((w) => w && w.author && w.text).slice(0, 40);
        if (!book || !col || !list.length || zone) {
            return;
        }
        // Trộn thứ tự để mỗi lần mở thiệp thấy lời chúc khác nhau
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                guestbookVisible = entries.some((en) => en.isIntersecting);
            }).observe(book);
        }
        zone = h('div', { class: 'wish-ticker-zone', 'aria-live': 'polite' });
        col.insertBefore(zone, col.firstChild);
        timer = setTimeout(show, FIRST_DELAY_MS);
    };

    return { start, stop };
};
