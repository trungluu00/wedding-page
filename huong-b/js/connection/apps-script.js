// Client gọi Google Apps Script (thay cho API PHP dewanakl/undangan-api của template gốc).
// Hợp đồng API dùng chung với hướng A:
//   GET  {url}?action=lookup&code=xxx → {success, found, data:{code,name,xungHo,side,groups:[...]}}
//   GET  {url}?action=wishes          → {success, data:[{author,relation,text,createdAt}]}
//   GET  {url}?action=settings        → {success, data:{events:{<id>:{time}}, accounts:[...]}}  (sheet CauHinh)
//   POST (Content-Type: text/plain, thân là JSON) → {success, message?}
//        {action:"rsvp", code, name, side, willAttend, guestCount, notes, hp}
//        {action:"wish", code, author, relation, text, hp}
//        {action:"open", code}
// Khi backend.appsScriptUrl rỗng → chế độ demo: dữ liệu mẫu + lưu vào localStorage của trình duyệt.
import { storage } from '../common/storage.js';

const TIMEOUT_MS = 12000;

const DEMO_GUESTS = {
    'bac-hung-7k2': { code: 'bac-hung-7k2', name: 'Hùng', xungHo: 'Bác', side: 'nha-trai', groups: ['nha-trai', 'ho-hang'] },
    'ban-lan-3x9': { code: 'ban-lan-3x9', name: 'Lan', xungHo: 'Bạn', side: 'nha-gai', groups: ['nha-gai'] },
    'ban-minh-p4d': { code: 'ban-minh-p4d', name: 'Minh', xungHo: 'Bạn', side: 'nha-trai', groups: ['nha-trai', 'ban-be'] },
};

const DEMO_WISHES = [
    // Lời chúc minh họa cho chế độ demo (chưa nối Google Sheet) — không gắn tên người thật
    { author: 'Lời chúc mẫu', relation: 'Chế độ demo', text: 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!', createdAt: '2026-11-01T09:00:00+07:00' },
];

/**
 * Ghép cấu hình từ Sheet vào config (sửa tại chỗ): giờ sự kiện theo id, tài khoản mừng cưới theo nhà.
 * @param {object} cfg
 * @param {object|null} data
 * @returns {boolean} có thay đổi hay không
 */
export const applySettings = (cfg, data) => {
    if (!data || typeof data !== 'object') {
        return false;
    }
    let changed = false;
    const times = data.events && typeof data.events === 'object' ? data.events : {};
    for (const ev of cfg.events ?? []) {
        const t = times[ev.id]?.time;
        if (typeof t === 'string' && (t === '' || /^\d{2}:\d{2}$/.test(t)) && t !== (ev.time ?? '')) {
            ev.time = t;
            changed = true;
        }
    }
    if (Array.isArray(data.accounts) && data.accounts.length && cfg.gifts) {
        const base = cfg.gifts.accounts ?? [];
        cfg.gifts.accounts = data.accounts.map((a) => {
            const out = { ...(base.find((b) => b.family === a.family) ?? { family: a.family }) };
            for (const k of ['bankBin', 'bankName', 'accountNo', 'accountName', 'qrImage']) {
                if (a[k]) {
                    out[k] = String(a[k]);
                }
            }
            // Sheet để trống số tài khoản → coi như chưa có (mục mừng cưới tự ẩn)
            if (!a.accountNo && !a.qrImage) {
                out.accountNo = '';
            }
            return out;
        });
        changed = true;
    }
    return changed;
};

/**
 * @param {string} baseUrl
 */
export const appsScript = (baseUrl) => {
    const url = String(baseUrl ?? '').trim();
    const isDemo = url.length === 0;
    const demo = storage('demo');

    const withTimeout = async (input, init = {}) => {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
        try {
            const res = await fetch(input, { ...init, signal: ctrl?.signal, redirect: 'follow', credentials: 'omit' });
            if (!res.ok) {
                throw new Error(`Máy chủ trả lỗi ${res.status}`);
            }
            const json = await res.json();
            if (!json || typeof json !== 'object') {
                throw new Error('Phản hồi không hợp lệ');
            }
            return json;
        } catch (e) {
            if (e?.name === 'AbortError') {
                throw new Error('Kết nối quá chậm, bạn thử lại sau ít phút nhé.');
            }
            throw e;
        } finally {
            if (timer) clearTimeout(timer);
        }
    };

    const get = (params) => {
        const u = new URL(url);
        for (const [k, v] of Object.entries(params)) {
            u.searchParams.set(k, v);
        }
        return withTimeout(u.toString(), { method: 'GET' });
    };

    // text/plain để là "simple request": không có preflight CORS, Apps Script nhận được.
    const post = (body) => withTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
    });

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    /**
     * @param {string} code
     * @returns {Promise<{success: boolean, found: boolean, data?: object}>}
     */
    const lookup = async (code) => {
        if (isDemo) {
            const g = DEMO_GUESTS[String(code).toLowerCase()];
            return g ? { success: true, found: true, data: { ...g } } : { success: true, found: false };
        }
        return get({ action: 'lookup', code });
    };

    /**
     * @returns {Promise<{success: boolean, data: Array<{author: string, relation: string, text: string, createdAt: string}>}>}
     */
    const wishes = async () => {
        if (isDemo) {
            const mine = demo.get('wishes') ?? [];
            return { success: true, data: [...mine, ...DEMO_WISHES] };
        }
        return get({ action: 'wishes' });
    };

    /** Giờ sự kiện + tài khoản mừng cưới sửa trên Google Sheet. Demo → data null (dùng wedding.config.js). */
    const settings = async () => {
        if (isDemo) {
            return { success: true, data: null };
        }
        return get({ action: 'settings' });
    };

    const rsvp = async (payload) => {
        const body = { action: 'rsvp', ...payload };
        if (isDemo) {
            await delay(400);
            const list = demo.get('rsvp') ?? [];
            list.push({ ...body, createdAt: new Date().toISOString() });
            demo.set('rsvp', list);
            return { success: true, message: 'Đã ghi nhận (chế độ demo, lưu trong trình duyệt).' };
        }
        return post(body);
    };

    const wish = async (payload) => {
        const body = { action: 'wish', ...payload };
        if (isDemo) {
            await delay(400);
            const list = demo.get('wishes') ?? [];
            list.unshift({ author: body.author, relation: body.relation, text: body.text, createdAt: new Date().toISOString() });
            demo.set('wishes', list);
            return { success: true, message: 'Đã gửi lời chúc (chế độ demo).' };
        }
        return post(body);
    };

    /** Báo khách đã mở thiệp. Không chờ, không báo lỗi cho khách. */
    const open = (code) => {
        if (!code) {
            return Promise.resolve({ success: true });
        }
        if (isDemo) {
            demo.set('opened', [...(demo.get('opened') ?? []), { code, at: new Date().toISOString() }].slice(-20));
            return Promise.resolve({ success: true });
        }
        return post({ action: 'open', code }).catch(() => ({ success: false }));
    };

    return {
        isDemo,
        lookup,
        wishes,
        settings,
        rsvp,
        wish,
        open,
    };
};
