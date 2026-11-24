/**
 * Kết nối Google Apps Script (xem apps-script/Code.gs).
 * Nếu `backend.appsScriptUrl` trong wedding.config.js để trống → chế độ demo:
 * không gọi mạng, RSVP / lời chúc chỉ lưu trong localStorage của trình duyệt.
 */
import config from '../wedding.config.js';

const ENDPOINT = String(config.backend?.appsScriptUrl || '').trim();
export const isDemo = !ENDPOINT;

if (isDemo) {
  console.info(
    '%c[Thiệp cưới] Chế độ demo%c — chưa điền backend.appsScriptUrl trong wedding.config.js. ' +
      'RSVP và lời chúc chỉ lưu trong trình duyệt này. Thử link mời mẫu: ?to=bac-hung-7k2 hoặc ?to=ban-lan-3x9, hoặc link theo nhà ?ben=nha-trai / ?ben=nha-gai',
    'font-weight:bold', ''
  );
}

// Khách mẫu cho chế độ demo
const DEMO_GUESTS = {
  'bac-hung-7k2': { code: 'bac-hung-7k2', name: 'Hùng', xungHo: 'Bác', side: 'nha-trai', groups: ['gia-dinh'] },
  'ban-lan-3x9': { code: 'ban-lan-3x9', name: 'Lan', xungHo: 'Bạn', side: 'nha-gai', groups: ['ban-be'] },
};

const LS_WISHES = 'wedding_demo_wishes';
const LS_RSVPS = 'wedding_demo_rsvps';
const readLS = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || '[]');
  } catch {
    return [];
  }
};
const writeLS = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* bộ nhớ đầy / chế độ riêng tư */
  }
};

/** Mã khách hợp lệ: chữ thường không dấu, số, gạch nối. */
export function normalizeCode(raw) {
  const code = String(raw || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(code) ? code : '';
}

async function apiGet(params) {
  const url = new URL(ENDPOINT);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(body) {
  // text/plain để là "simple request" → không có CORS preflight (Apps Script không trả lời OPTIONS)
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Tra một khách theo mã. Trả về {code,name,xungHo,side,groups} hoặc null. */
export async function lookupGuest(code) {
  if (!code) return null;
  if (isDemo) return DEMO_GUESTS[code] || null;
  try {
    const json = await apiGet({ action: 'lookup', code });
    return json && json.success && json.found ? json.data : null;
  } catch (err) {
    console.warn('[Thiệp cưới] Không tra được khách mời:', err);
    return null;
  }
}

/** Danh sách lời chúc đã duyệt [{author,relation,text,createdAt}], mới nhất trước. */
export async function fetchWishes() {
  if (isDemo) return readLS(LS_WISHES);
  try {
    const json = await apiGet({ action: 'wishes' });
    return json && json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('[Thiệp cưới] Không tải được lời chúc:', err);
    return [];
  }
}

/** Gửi RSVP. Trả về {success, message?}. */
export async function sendRsvp(data) {
  const payload = { action: 'rsvp', ...data };
  if (isDemo) {
    const list = readLS(LS_RSVPS);
    list.push({ ...payload, createdAt: new Date().toISOString() });
    writeLS(LS_RSVPS, list);
    return { success: true };
  }
  try {
    return await apiPost(payload);
  } catch (err) {
    return { success: false, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' };
  }
}

/** Gửi lời chúc. Trả về {success, message?}. */
export async function sendWish(data) {
  const payload = { action: 'wish', ...data };
  if (isDemo) {
    const list = readLS(LS_WISHES);
    list.unshift({ author: data.author, relation: data.relation, text: data.text, createdAt: new Date().toISOString() });
    writeLS(LS_WISHES, list.slice(0, 200));
    return { success: true };
  }
  try {
    return await apiPost(payload);
  } catch (err) {
    return { success: false, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' };
  }
}

/**
 * Cấu hình sửa được trên Google Sheet (sheet CauHinh): giờ sự kiện, tài khoản mừng cưới.
 * Trả về {events:{id:{time}}, accounts:[...]} hoặc null (demo / lỗi mạng → dùng wedding.config.js).
 */
export async function fetchSettings() {
  if (isDemo) return null;
  try {
    const json = await apiGet({ action: 'settings' });
    return json && json.success && json.data && typeof json.data === 'object' ? json.data : null;
  } catch (err) {
    console.warn('[Thiệp cưới] Không tải được cấu hình từ Sheet:', err);
    return null;
  }
}

/** Ghép cấu hình từ Sheet vào config (sửa tại chỗ). Trả về true nếu có thay đổi cần vẽ lại. */
export function applySettings(cfg, data) {
  if (!data) return false;
  let changed = false;
  const times = data.events && typeof data.events === 'object' ? data.events : {};
  (cfg.events || []).forEach((ev) => {
    const t = times[ev.id] && times[ev.id].time;
    if (typeof t === 'string' && (t === '' || /^\d{2}:\d{2}$/.test(t)) && t !== (ev.time || '')) {
      ev.time = t;
      changed = true;
    }
  });
  if (Array.isArray(data.accounts) && data.accounts.length && cfg.gifts) {
    const base = cfg.gifts.accounts || [];
    cfg.gifts.accounts = data.accounts.map((a) => {
      const out = { ...(base.find((b) => b.family === a.family) || { family: a.family }) };
      ['bankBin', 'bankName', 'accountNo', 'accountName', 'qrImage'].forEach((k) => {
        if (a[k]) out[k] = String(a[k]);
      });
      // Sheet để trống số tài khoản → coi như chưa có (mục mừng cưới tự ẩn)
      if (!a.accountNo && !a.qrImage) out.accountNo = '';
      return out;
    });
    changed = true;
  }
  return changed;
}

/** Ghi nhận khách đã mở thiệp (một lần mỗi phiên). */
export function trackOpen(code) {
  if (!code || isDemo) return;
  const key = `wedding_opened_${code}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
  apiPost({ action: 'open', code }).catch(() => {});
}
