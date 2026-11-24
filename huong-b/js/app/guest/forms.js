// Xác nhận tham dự (RSVP) và Lời chúc — thay cho phần bình luận/like/GIF gọi API PHP của
// dewanakl/undangan. Dữ liệu gửi về Google Apps Script (hoặc localStorage ở chế độ demo).
// Mọi chữ khách nhập chỉ được hiển thị qua textContent.
import { util } from '../../common/util.js';
import { storage } from '../../common/storage.js';
import { relativeTime, plainDate } from '../../common/format.js';

const { h, icon } = util;

const WISH_COOLDOWN_MS = 30 * 1000;

/**
 * @param {ReturnType<import('../../connection/apps-script.js').appsScript>} client
 */
export const forms = (client) => {
    const saved = storage('rsvp');
    const wishState = storage('wish');

    const field = (id, label, input, hint = null) => h('div', { class: 'mb-3 text-start' },
        h('label', { class: 'form-label small mb-1', for: id }, label),
        input,
        hint ? h('div', { class: 'form-text small' }, hint) : null);

    const honeypot = () => h('div', { class: 'visually-trap', 'aria-hidden': 'true' },
        h('label', { for: `hp-${Math.random().toString(36).slice(2, 7)}` }, 'Để trống ô này'),
        h('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', class: 'js-hp' }));

    /** Nhóm nút chọn to, dễ bấm trên điện thoại: [[value, label, icon?], ...] */
    const chips = (name, options, value, extra = '') => h('div', { class: `choice-chips ${extra}`.trim(), role: 'radiogroup' },
        options.map(([v, label, ic]) => {
            const id = `${name}-${v}`;
            return h('label', { class: 'choice-chip', for: id },
                h('input', { type: 'radio', name, id, value: v, checked: v === value || null }),
                h('span', null, ic ? icon(ic, 'choice-chip-icon') : null, h('span', null, label)));
        }));

    const group = (label, body) => h('fieldset', { class: 'mb-3 text-start border-0 p-0' },
        h('legend', { class: 'form-label small mb-2 fw-semibold' }, label),
        body);

    // ------------------------------------------------------------------ RSVP
    const rsvp = (cfg, ctx) => {
        const max = Math.max(1, Number(cfg.backend?.maxGuestsPerInvite) || 1);
        const deadline = cfg.backend?.rsvpDeadline;
        const prev = saved.get('last');

        const name = h('input', { type: 'text', id: 'rsvp-name', class: 'form-control rounded-4', maxlength: '60', autocomplete: 'name', required: true, placeholder: 'Tên của bạn' });
        name.value = prev?.name ?? (ctx.guest ? ctx.khach : '');

        const countValue = String(Math.min(max, prev?.guestCount || 1));
        const count = chips('rsvp-count', Array.from({ length: max }, (_, i) => [String(i + 1), `${i + 1} người`]), countValue, 'choice-chips--count');

        const notes = h('textarea', { id: 'rsvp-notes', class: 'form-control rounded-4', rows: '2', maxlength: '300', placeholder: 'VD: ăn chay, đi cùng em bé...' });
        notes.value = prev?.notes ?? '';

        const side = prev?.side ?? ctx.guest?.side ?? ctx.side ?? '';
        const attend = prev ? (prev.willAttend ? 'yes' : 'no') : 'yes';

        const countWrap = group('Số người đến (tính cả bạn)', count);
        const button = h('button', { type: 'submit', class: 'btn btn-primary rounded-pill px-4 py-2 fw-semibold rsvp-submit', 'data-offline-disabled': 'false' },
            icon('fa-paper-plane', 'me-2'), 'Gửi xác nhận');
        const done = h('div', { class: 'alert rounded-4 small mb-3 d-none', id: 'rsvp-done', role: 'status', style: { backgroundColor: 'var(--c-soft)', color: 'var(--c-strong)', border: 0 } });

        const form = h('form', { class: 'card-c p-4', id: 'rsvp-form', novalidate: true },
            field('rsvp-name', 'Họ tên', name),
            group('Bạn là khách của', chips('rsvp-side', [['nha-trai', 'Nhà trai'], ['nha-gai', 'Nhà gái']], side)),
            group('Bạn sẽ đến chứ?', chips('rsvp-attend', [
                ['yes', 'Có, mình sẽ đến', 'fa-champagne-glasses'],
                ['no', 'Tiếc quá, mình bận', 'fa-envelope-open-text'],
            ], attend, 'choice-chips--cards')),
            countWrap,
            field('rsvp-notes', 'Lời nhắn (không bắt buộc)', notes),
            honeypot(),
            done,
            h('div', { class: 'd-grid' }, button),
        );

        const syncCount = () => {
            const yes = form.querySelector('input[name="rsvp-attend"]:checked')?.value !== 'no';
            countWrap.classList.toggle('d-none', !yes);
        };
        form.querySelectorAll('input[name="rsvp-attend"]').forEach((r) => r.addEventListener('change', syncCount));
        syncCount();

        const showDone = (data) => {
            done.classList.remove('d-none');
            done.textContent = data.willAttend
                ? `Cảm ơn ${data.name}! Chúng tôi đã ghi nhận ${data.guestCount} người sẽ tới. Bạn có thể gửi lại nếu thay đổi.`
                : `Cảm ơn ${data.name} đã báo trước. Mong sớm gặp bạn dịp khác! Bạn có thể gửi lại nếu thay đổi.`;
        };
        if (prev) {
            showDone(prev);
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const willAttend = form.querySelector('input[name="rsvp-attend"]:checked')?.value !== 'no';
            const sideVal = form.querySelector('input[name="rsvp-side"]:checked')?.value ?? '';
            const data = {
                code: ctx.guest?.code ?? '',
                name: name.value.trim(),
                side: sideVal,
                willAttend,
                guestCount: willAttend ? Number(form.querySelector('input[name="rsvp-count"]:checked')?.value || 1) : 0,
                notes: notes.value.trim(),
                hp: form.querySelector('.js-hp')?.value ?? '',
            };
            if (data.name.length < 2) {
                util.notify('Bạn vui lòng nhập họ tên.').error();
                name.focus();
                return;
            }
            if (!data.side) {
                util.notify('Bạn vui lòng chọn khách nhà trai hay nhà gái.').error();
                return;
            }
            const btn = util.disableButton(button);
            try {
                const res = await client.rsvp(data);
                if (!res?.success) {
                    throw new Error(res?.message || 'Gửi không thành công');
                }
                saved.set('last', data);
                showDone(data);
                document.dispatchEvent(new CustomEvent('rsvp:done', { detail: data }));
                util.notify(res.message || 'Đã gửi xác nhận. Cảm ơn bạn!').success();
            } catch (err) {
                util.notify(`Chưa gửi được: ${err.message}. Bạn thử lại nhé.`).error();
            } finally {
                btn.restore();
            }
        });

        return h('section', { id: 'rsvp', class: 'bg-page text-center' },
            h('p', { class: 'section-kicker mb-1' }, 'Xác nhận tham dự'),
            h('h2', { class: 'section-title mb-0' }, 'Bạn sẽ đến chứ?'),
            h('div', { class: 'divider-ornament', 'aria-hidden': 'true' }, icon('fa-heart', 'fa-xs')),
            deadline ? h('p', { class: 'small text-muted-c' }, `Bạn phản hồi giúp trước ngày ${plainDate(deadline)} để chúng tôi chuẩn bị chu đáo nhé.`) : null,
            form,
        );
    };

    // ---------------------------------------------------------------- Lời chúc
    /** @type {HTMLElement|null} */
    let listEl = null;
    /** @type {HTMLElement|null} */
    let countEl = null;

    const wishItem = (w) => h('div', { class: 'wish-item text-start' },
        h('div', { class: 'd-flex justify-content-between align-items-baseline gap-2' },
            h('span', { class: 'wish-author' }, w.author || 'Khách mời'),
            h('span', { class: 'wish-meta flex-shrink-0' }, relativeTime(w.createdAt))),
        w.relation ? h('div', { class: 'wish-meta mb-1' }, w.relation) : null,
        h('div', null, w.text));

    const setList = (items) => {
        if (!listEl) {
            return;
        }
        const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        countEl.textContent = sorted.length ? `${sorted.length} lời chúc` : '';
        listEl.replaceChildren(...(sorted.length
            ? sorted.map(wishItem)
            : [h('p', { class: 'text-muted-c small m-0 wish-empty' }, 'Chưa có lời chúc nào. Bạn hãy là người đầu tiên nhé!')]));
    };

    let cache = [];

    /**
     * Thêm một lời chúc lên đầu danh sách mà không dựng lại cả danh sách (trang không nhảy):
     * phần tử mới hiện dần bằng opacity/transform; danh sách có chiều cao giới hạn và cuộn riêng,
     * nên nếu khách đang cuộn giữa danh sách thì giữ nguyên vị trí đang đọc.
     */
    const prependWish = (w) => {
        cache = [w, ...cache];
        if (!listEl) {
            return;
        }
        listEl.querySelector('.wish-empty')?.remove();
        const prevTop = listEl.scrollTop;
        const prevHeight = listEl.scrollHeight;
        const el = wishItem(w);
        el.classList.add('wish-enter');
        listEl.prepend(el);
        if (prevTop > 0) {
            listEl.scrollTop = prevTop + (listEl.scrollHeight - prevHeight);
        }
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('wish-enter')));
        countEl.textContent = `${cache.length} lời chúc`;
    };

    const loadWishes = async () => {
        if (!listEl) {
            return [];
        }
        try {
            const res = await client.wishes();
            cache = Array.isArray(res?.data) ? res.data : [];
            setList(cache);
        } catch {
            listEl.replaceChildren(h('p', { class: 'text-muted-c small m-0' }, 'Chưa tải được lời chúc, bạn tải lại trang sau nhé.'));
        }
        return cache;
    };

    const wishes = (cfg, ctx) => {
        const author = h('input', { type: 'text', id: 'wish-author', class: 'form-control rounded-4', maxlength: '60', autocomplete: 'name', required: true, placeholder: 'Tên của bạn' });
        author.value = ctx.guest ? ctx.khach : '';
        const relation = h('input', { type: 'text', id: 'wish-relation', class: 'form-control rounded-4', maxlength: '60', placeholder: 'VD: Bạn đại học của Nhi' });
        const text = h('textarea', { id: 'wish-text', class: 'form-control rounded-4', rows: '4', maxlength: '500', required: true, placeholder: 'Viết lời chúc gửi cô dâu chú rể...' });
        const button = h('button', { type: 'submit', class: 'btn btn-primary rounded-pill px-4', 'data-offline-disabled': 'false' },
            icon('fa-heart', 'me-2'), 'Gửi lời chúc');

        const form = h('form', { class: 'card-c p-4 mb-4', id: 'wish-form', novalidate: true },
            field('wish-author', 'Họ tên', author),
            field('wish-relation', 'Bạn là (không bắt buộc)', relation),
            field('wish-text', 'Lời chúc', text),
            honeypot(),
            h('div', { class: 'd-grid' }, button));

        listEl = h('div', { class: 'wish-list', id: 'wish-list' }, h('p', { class: 'text-muted-c small m-0' }, 'Đang tải lời chúc...'));
        countEl = h('p', { class: 'small text-muted-c mb-2', id: 'wish-count' });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                code: ctx.guest?.code ?? '',
                author: author.value.trim(),
                relation: relation.value.trim(),
                text: text.value.trim(),
                hp: form.querySelector('.js-hp')?.value ?? '',
            };
            if (data.author.length < 2) {
                util.notify('Bạn vui lòng nhập họ tên.').error();
                author.focus();
                return;
            }
            if (data.text.length < 2) {
                util.notify('Bạn vui lòng viết lời chúc.').error();
                text.focus();
                return;
            }
            const last = Number(wishState.get('lastAt') || 0);
            if (Date.now() - last < WISH_COOLDOWN_MS) {
                util.notify('Bạn vừa gửi lời chúc, chờ một chút rồi gửi tiếp nhé.').info();
                return;
            }
            const btn = util.disableButton(button);
            try {
                const res = await client.wish(data);
                if (!res?.success) {
                    throw new Error(res?.message || 'Gửi không thành công');
                }
                wishState.set('lastAt', Date.now());
                text.value = '';
                prependWish({ author: data.author, relation: data.relation, text: data.text, createdAt: new Date().toISOString() });
                util.notify('Cảm ơn lời chúc của bạn!').success();
            } catch (err) {
                util.notify(`Chưa gửi được: ${err.message}. Bạn thử lại nhé.`).error();
            } finally {
                btn.restore();
            }
        });

        return h('section', { id: 'wishes', class: 'bg-alt text-center' },
            h('p', { class: 'section-kicker mb-1' }, 'Sổ lưu bút'),
            h('h2', { class: 'section-title mb-0' }, 'Lời chúc'),
            h('div', { class: 'divider-ornament', 'aria-hidden': 'true' }, icon('fa-heart', 'fa-xs')),
            form,
            countEl,
            listEl,
        );
    };

    return {
        rsvp,
        wishes,
        loadWishes,
    };
};
