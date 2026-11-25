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

    /**
     * Lần xác nhận đã gửi trên máy này CHO ĐÚNG LINK MỜI NÀY (theo mã khách; link chung = mã rỗng).
     * Lưu theo mã để mở link của người khác trên cùng điện thoại không hiện xác nhận / tên của người trước.
     * (Bản cũ lưu một mục "last" chung — chỉ dùng lại nếu đúng mã.)
     */
    const lastRsvp = (code) => {
        const c = String(code ?? '');
        const mine = saved.get(`last:${c}`);
        if (mine) {
            return mine;
        }
        const old = saved.get('last');
        return old && (old.code ?? '') === c ? old : null;
    };

    /**
     * Tên khách đã tự gõ ở form xác nhận / lời chúc trên máy này — chỉ dùng lại cho cùng link mời
     * (cùng mã khách), để mở link của người khác trên cùng điện thoại không bị điền nhầm tên.
     */
    const typedName = (code) => {
        const r = lastRsvp(code);
        if (r?.name) {
            return r.name;
        }
        const w = wishState.get('author');
        return w?.name && (w.code ?? '') === code ? w.name : '';
    };

    /**
     * Mã cho một lần gửi: giữ nguyên khi khách bấm gửi lại CÙNG nội dung (sau lỗi mạng / quá chậm) → Code.gs bỏ qua
     * bản trùng, Sheet không bị hai dòng. Nội dung khác, hoặc đã gửi thành công (reset) → mã mới.
     */
    const requestId = () => {
        let key = '';
        let id = '';
        return {
            next: (payload) => {
                const k = JSON.stringify({ ...payload, hp: undefined, rid: undefined });
                if (k !== key || !id) {
                    key = k;
                    id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
                }
                return id;
            },
            reset: () => {
                key = '';
                id = '';
            },
        };
    };
    const rsvpRid = requestId();
    const wishRid = requestId();

    /** Thông báo lỗi gửi bằng tiếng Việt (lỗi kết nối của trình duyệt có thể là tiếng Anh: không hiện nguyên văn). */
    const failText = (err) => {
        const msg = String(err?.message ?? '').replace(/[.!\s]+$/, '');
        const vietnamese = err?.friendly || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(msg);
        return `Chưa gửi được${vietnamese && msg ? ` (${msg})` : ''}. Xin vui lòng thử lại sau ít phút.`;
    };

    /** Điền tên vào ô còn trống (khách vừa gửi ở form kia). */
    const fillIfEmpty = (input, value) => {
        if (input && !input.value.trim() && value) {
            input.value = value;
        }
    };

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
        const prev = lastRsvp(ctx.code ?? '');

        const name = h('input', { type: 'text', id: 'rsvp-name', class: 'form-control rounded-4', maxlength: '60', autocomplete: 'name', required: true, placeholder: 'Họ và tên' });
        // Điền sẵn: lần gửi trước → tên đã gõ ở form lời chúc → tên khách trong link mời (vd "Bác Hùng")
        name.value = prev?.name ?? (typedName(ctx.code ?? '') || ctx.guestNamePlain || '');
        document.addEventListener('wish:done', (e) => fillIfEmpty(name, e.detail?.author));

        const countValue = String(Math.min(max, prev?.guestCount || 1));
        const count = chips('rsvp-count', Array.from({ length: max }, (_, i) => [String(i + 1), `${i + 1} người`]), countValue, 'choice-chips--count');

        const notes = h('textarea', { id: 'rsvp-notes', class: 'form-control rounded-4', rows: '2', maxlength: '300', placeholder: 'Ví dụ: đi cùng gia đình, ăn chay...' });
        notes.value = prev?.notes ?? '';

        const side = prev?.side ?? ctx.guest?.side ?? ctx.side ?? '';
        const attend = prev ? (prev.willAttend ? 'yes' : 'no') : 'yes';

        const countWrap = group('Số người tham dự (kể cả người xác nhận)', count);
        const button = h('button', { type: 'submit', class: 'btn btn-primary rounded-pill px-4 py-2 fw-semibold rsvp-submit', 'data-offline-disabled': 'false' },
            icon('fa-paper-plane', 'me-2'), 'Gửi xác nhận');
        const done = h('div', { class: 'alert rounded-4 small mb-3 d-none', id: 'rsvp-done', role: 'status', style: { backgroundColor: 'var(--c-soft)', color: 'var(--c-strong)', border: 0 } });

        const form = h('form', { class: 'card-c p-4', id: 'rsvp-form', novalidate: true },
            field('rsvp-name', 'Họ và tên', name),
            group('Khách mời của', chips('rsvp-side', [['nha-trai', 'Nhà trai'], ['nha-gai', 'Nhà gái']], side)),
            group('Tham dự', chips('rsvp-attend', [
                ['yes', 'Tôi sẽ tham dự', 'fa-champagne-glasses'],
                ['no', 'Rất tiếc, tôi không thể đến', 'fa-envelope-open-text'],
            ], attend, 'choice-chips--cards')),
            countWrap,
            field('rsvp-notes', 'Lời nhắn gửi cô dâu chú rể (không bắt buộc)', notes),
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
                ? `Xin cảm ơn ${data.name}! Chúng tôi đã ghi nhận ${data.guestCount} người tham dự. Nếu có thay đổi, xin vui lòng gửi lại xác nhận.`
                : `Xin cảm ơn ${data.name} đã báo trước. Rất mong được gặp lại vào dịp khác! Nếu có thay đổi, xin vui lòng gửi lại xác nhận.`;
        };
        if (prev) {
            showDone(prev);
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const willAttend = form.querySelector('input[name="rsvp-attend"]:checked')?.value !== 'no';
            const sideVal = form.querySelector('input[name="rsvp-side"]:checked')?.value ?? '';
            const data = {
                code: ctx.code ?? '',
                name: name.value.trim(),
                side: sideVal,
                willAttend,
                guestCount: willAttend ? Number(form.querySelector('input[name="rsvp-count"]:checked')?.value || 1) : 0,
                notes: notes.value.trim(),
                hp: form.querySelector('.js-hp')?.value ?? '',
            };
            if (data.name.length < 2) {
                util.notify('Xin vui lòng nhập họ và tên.').error();
                name.focus();
                return;
            }
            if (!data.side) {
                util.notify('Xin vui lòng chọn khách mời nhà trai hay nhà gái.').error();
                return;
            }
            if (button.dataset.busy === '1') {
                return; // đang gửi lần trước
            }
            data.rid = rsvpRid.next(data);
            const btn = util.disableButton(button);
            try {
                const res = await client.rsvp(data);
                if (!res?.success) {
                    throw new Error(res?.message || 'gửi không thành công');
                }
                rsvpRid.reset();
                saved.set(`last:${data.code}`, data);
                showDone(data);
                document.dispatchEvent(new CustomEvent('rsvp:done', { detail: data }));
                util.notify(res.message || 'Đã gửi xác nhận. Xin chân thành cảm ơn!').success();
            } catch (err) {
                util.notify(failText(err)).error();
            } finally {
                btn.restore();
            }
        });

        return h('section', { id: 'rsvp', class: 'bg-page text-center' },
            h('p', { class: 'section-kicker mb-1' }, 'Xác nhận tham dự'),
            h('h2', { class: 'section-title mb-0' }, 'Rất mong được đón tiếp'),
            h('div', { class: 'divider-ornament', 'aria-hidden': 'true' }, icon('fa-heart', 'fa-xs')),
            // Quá hạn thì thôi nhắc "phản hồi trước ngày…" (vẫn nhận xác nhận như thường)
            deadline && Date.now() <= new Date(`${deadline}T23:59:59+07:00`).getTime()
                ? h('p', { class: 'small text-muted-c' }, `Xin vui lòng phản hồi trước ngày ${plainDate(deadline)} để gia đình chúng tôi chuẩn bị chu đáo.`) : null,
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
            : [h('p', { class: 'text-muted-c small m-0 wish-empty' }, 'Chưa có lời chúc nào. Rất mong nhận được lời chúc đầu tiên!')]));
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
            // bỏ qua mục hỏng (null, thiếu tên / lời chúc) thay vì báo lỗi cả danh sách
            cache = (Array.isArray(res?.data) ? res.data : []).filter((w) => w && typeof w === 'object' && w.author && w.text);
            setList(cache);
        } catch {
            listEl.replaceChildren(h('p', { class: 'text-muted-c small m-0' }, 'Chưa tải được lời chúc, xin vui lòng tải lại trang sau.'));
        }
        return cache;
    };

    const wishes = (cfg, ctx) => {
        const author = h('input', { type: 'text', id: 'wish-author', class: 'form-control rounded-4', maxlength: '60', autocomplete: 'name', required: true, placeholder: 'Họ và tên' });
        // Điền sẵn: tên đã gõ trước đó trên link này → tên khách trong link mời
        author.value = typedName(ctx.code ?? '') || ctx.guestNamePlain || '';
        document.addEventListener('rsvp:done', (e) => fillIfEmpty(author, e.detail?.name));
        const relation = h('input', { type: 'text', id: 'wish-relation', class: 'form-control rounded-4', maxlength: '60', placeholder: 'Ví dụ: Đồng nghiệp của Trung' });
        const text = h('textarea', { id: 'wish-text', class: 'form-control rounded-4', rows: '4', maxlength: '500', required: true, placeholder: 'Viết lời chúc gửi cô dâu chú rể...' });
        const button = h('button', { type: 'submit', class: 'btn btn-primary rounded-pill px-4', 'data-offline-disabled': 'false' },
            icon('fa-heart', 'me-2'), 'Gửi lời chúc');

        const form = h('form', { class: 'card-c p-4 mb-4', id: 'wish-form', novalidate: true },
            field('wish-author', 'Họ và tên', author),
            field('wish-relation', 'Mối quan hệ (không bắt buộc)', relation),
            field('wish-text', 'Lời chúc', text),
            honeypot(),
            h('div', { class: 'd-grid' }, button));

        listEl = h('div', { class: 'wish-list', id: 'wish-list' }, h('p', { class: 'text-muted-c small m-0' }, 'Đang tải lời chúc...'));
        countEl = h('p', { class: 'small text-muted-c mb-2', id: 'wish-count' });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                code: ctx.code ?? '',
                author: author.value.trim(),
                relation: relation.value.trim(),
                text: text.value.trim(),
                hp: form.querySelector('.js-hp')?.value ?? '',
            };
            if (data.author.length < 2) {
                util.notify('Xin vui lòng nhập họ và tên.').error();
                author.focus();
                return;
            }
            if (data.text.length < 2) {
                util.notify('Xin vui lòng viết lời chúc.').error();
                text.focus();
                return;
            }
            const last = Number(wishState.get('lastAt') || 0);
            if (Date.now() - last < WISH_COOLDOWN_MS) {
                util.notify('Lời chúc vừa được gửi, xin chờ giây lát trước khi gửi tiếp.').info();
                return;
            }
            if (button.dataset.busy === '1') {
                return; // đang gửi lần trước
            }
            data.rid = wishRid.next(data);
            const btn = util.disableButton(button);
            try {
                const res = await client.wish(data);
                if (!res?.success) {
                    throw new Error(res?.message || 'gửi không thành công');
                }
                wishRid.reset();
                wishState.set('lastAt', Date.now());
                wishState.set('author', { name: data.author, code: data.code });
                document.dispatchEvent(new CustomEvent('wish:done', { detail: data }));
                text.value = '';
                prependWish({ author: data.author, relation: data.relation, text: data.text, createdAt: new Date().toISOString() });
                util.notify('Xin chân thành cảm ơn lời chúc!').success();
            } catch (err) {
                util.notify(failText(err)).error();
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
        lastRsvp,
        wishes,
        loadWishes,
    };
};
