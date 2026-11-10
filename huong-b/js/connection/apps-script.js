// Client gọi Google Apps Script (thay cho API PHP dewanakl/undangan-api của template gốc).
// Hợp đồng API dùng chung với hướng A:
//   GET  {url}?action=lookup&code=xxx → {success, found, data:{code,name,xungHo,side,groups:[...]}}
//   GET  {url}?action=wishes          → {success, data:[{author,relation,text,createdAt}]}
//   POST (Content-Type: text/plain, thân là JSON) → {success, message?}
//        {action:"rsvp", code, name, side, willAttend, guestCount, notes, hp}
//        {action:"wish", code, author, relation, text, hp}
//        {action:"open", code}
// Khi backend.appsScriptUrl rỗng → chế độ demo: dữ liệu mẫu + lưu vào localStorage của trình duyệt.
import { storage } from '../common/storage.js';

const TIMEOUT_MS = 12000;

const DEMO_GUESTS = {
    'bac-hung': { code: 'bac-hung', name: 'Hùng', xungHo: 'Bác', side: 'nha-trai', groups: ['nha-trai', 'ho-hang'] },
    'co-lan': { code: 'co-lan', name: 'Lan', xungHo: 'Cô', side: 'nha-gai', groups: ['nha-gai'] },
    'ban-minh': { code: 'ban-minh', name: 'Minh', xungHo: 'Bạn', side: 'nha-trai', groups: ['nha-trai', 'ban-be'] },
};

const DEMO_WISHES = [
    // Lời chúc minh họa cho chế độ demo (chưa nối Google Sheet) — không gắn tên người thật
    { author: 'Lời chúc mẫu', relation: 'Chế độ demo', text: 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!', createdAt: '2026-11-01T09:00:00+07:00' },
];

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
        rsvp,
        wish,
        open,
    };
};
