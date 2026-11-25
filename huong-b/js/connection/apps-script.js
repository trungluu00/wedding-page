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
const POST_TIMEOUT_MS = 30000;

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
        // Giờ hợp lệ 00:00–23:59 (giờ sai như "25:00" làm mất ngày của sự kiện → giữ giờ trong config)
        if (typeof t === 'string' && (t === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) && t !== (ev.time ?? '')) {
            ev.time = t;
            changed = true;
        }
    }
    // Lời trên thiệp sửa trong Sheet (câu trích, giới thiệu cô dâu chú rể); ô trống → giữ lời mặc định
    const texts = data.texts && typeof data.texts === 'object' ? data.texts : {};
    const str = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 600) : '');
    if (str(texts.quote) && cfg.texts) {
        cfg.texts.quote = str(texts.quote);
        changed = true;
    }
    if (str(texts.groomBio) && cfg.couple?.groom) {
        cfg.couple.groom.bio = str(texts.groomBio);
        changed = true;
    }
    if (str(texts.brideBio) && cfg.couple?.bride) {
        cfg.couple.bride.bio = str(texts.brideBio);
        changed = true;
    }
    const accounts = Array.isArray(data.accounts) ? data.accounts.filter((a) => a && typeof a === 'object' && a.family) : [];
    if (accounts.length && cfg.gifts) {
        const base = cfg.gifts.accounts ?? [];
        cfg.gifts.accounts = accounts.map((a) => {
            const out = { ...(base.find((b) => b.family === a.family) ?? { family: a.family }) };
            for (const k of ['bankBin', 'bankName', 'accountNo', 'accountName', 'qrImage']) {
                if (a[k]) {
                    out[k] = String(a[k]);
                }
            }
            // Sheet là chuẩn cho số tài khoản: ô trống thì không dùng số giữ chỗ trong config
            // (chỉ có ảnh QR riêng → thẻ chỉ hiện QR; không QR, không số → mục mừng cưới tự ẩn)
            if (!a.accountNo) {
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

    /** Lỗi gọi Web App, câu chữ tiếng Việt để hiện thẳng cho khách. */
    const fail = (msg) => Object.assign(new Error(msg), { friendly: true });

    const withTimeout = async (input, init = {}, ms = TIMEOUT_MS) => {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
        try {
            // no-store: không dùng bộ nhớ đệm của trình duyệt — Chrome bắt yêu cầu GET giống hệt nhau chờ nhau
            // (lượt tra thử lại sẽ kẹt sau lượt đầu đang chậm), và dữ liệu Sheet luôn phải mới.
            let res;
            try {
                res = await fetch(input, { ...init, signal: ctrl?.signal, redirect: 'follow', credentials: 'omit', cache: 'no-store' });
            } catch (e) {
                throw e?.name === 'AbortError' ? fail('kết nối quá chậm') : fail('không kết nối được, xin kiểm tra mạng');
            }
            if (!res.ok) {
                throw fail(`máy chủ đang bận (mã ${res.status})`);
            }
            let json;
            try {
                json = await res.json();
            } catch (e) {
                throw e?.name === 'AbortError' ? fail('kết nối quá chậm') : fail('máy chủ trả lời không hợp lệ');
            }
            if (!json || typeof json !== 'object') {
                throw fail('máy chủ trả lời không hợp lệ');
            }
            return json;
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
    // Gửi (xác nhận / lời chúc) chờ tới 30 giây: Web App có lúc trả lời 6–23 giây; bỏ cuộc sớm thì khách thấy
    // "chưa gửi được" trong khi Sheet vẫn ghi → gửi lại bị trùng (Code.gs bỏ qua bản trùng theo mã rid).
    const post = (body) => withTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
    }, POST_TIMEOUT_MS);

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    /**
     * @param {string} code
     * @param {number} [attempt=1] lượt thử lại (≥ 2) có địa chỉ khác lượt đầu để trình duyệt gửi song song
     * @returns {Promise<{success: boolean, found: boolean, data?: object}>}
     */
    const lookup = async (code, attempt = 1) => {
        if (isDemo) {
            const g = DEMO_GUESTS[String(code).toLowerCase()];
            return g ? { success: true, found: true, data: { ...g } } : { success: true, found: false };
        }
        return get(attempt > 1 ? { action: 'lookup', code, try: String(attempt) } : { action: 'lookup', code });
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

    /**
     * Giờ sự kiện + tài khoản mừng cưới sửa trên Google Sheet. Demo → data null (dùng wedding.config.js).
     * @param {number} [attempt=1] lượt thử lại (≥ 2) có địa chỉ khác để trình duyệt gửi song song
     */
    const settings = async (attempt = 1) => {
        if (isDemo) {
            return { success: true, data: null };
        }
        return get(attempt > 1 ? { action: 'settings', try: String(attempt) } : { action: 'settings' });
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
