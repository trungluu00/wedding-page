// Định dạng ngày giờ kiểu Việt Nam, link Google Calendar, link QR VietQR.
// Tự tính theo múi giờ +07:00 (không phụ thuộc dữ liệu ngôn ngữ của trình duyệt trong app).
import { util } from './util.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {{date: string, time?: string}} ev
 * @returns {Date|null}
 */
export const eventDate = (ev) => {
    if (!ev?.date) {
        return null;
    }
    const d = new Date(`${ev.date}T${ev.time || '00:00'}:00+07:00`);
    return Number.isNaN(d.getTime()) ? null : d;
};

/** Các thành phần ngày theo giờ Việt Nam. */
const vnParts = (d) => {
    const v = new Date(d.getTime() + VN_OFFSET_MS);
    return { y: v.getUTCFullYear(), m: v.getUTCMonth() + 1, day: v.getUTCDate(), wd: v.getUTCDay(), hh: v.getUTCHours(), mm: v.getUTCMinutes() };
};

/** "Chủ nhật, ngày 10 tháng 01 năm 2027" */
export const longDate = (d) => {
    const p = vnParts(d);
    return `${WEEKDAYS[p.wd]}, ngày ${pad(p.day)} tháng ${pad(p.m)} năm ${p.y}`;
};

/** "10.01.2027" */
export const shortDate = (d) => {
    const p = vnParts(d);
    return `${pad(p.day)}.${pad(p.m)}.${p.y}`;
};

/** "11 giờ 00" */
export const timeText = (d) => {
    const p = vnParts(d);
    return `${pad(p.hh)} giờ ${pad(p.mm)}`;
};

export const weekday = (d) => WEEKDAYS[vnParts(d).wd];
export const dayNum = (d) => pad(vnParts(d).day);
export const monthYear = (d) => {
    const p = vnParts(d);
    return `Tháng ${pad(p.m)} · ${p.y}`;
};

/** "YYYY-MM-DD" → "31/12/2026" */
export const plainDate = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s ?? ''));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s ?? '');
};

/** Thời điểm tương đối cho lời chúc: "vừa xong", "5 phút trước"... */
export const relativeTime = (value) => {
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) {
        return '';
    }
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return 'vừa xong';
    if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
    if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
    if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
    return shortDate(new Date(t));
};

/**
 * Link "Thêm vào Google Calendar". Thời lượng mặc định 3 giờ.
 * @param {object} ev sự kiện trong config
 * @param {string} title
 * @param {string} details
 * @returns {string}
 */
export const calendarUrl = (ev, title, details) => {
    const start = eventDate(ev);
    if (!start) {
        return '#';
    }
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const fmt = (d) => {
        const p = vnParts(d);
        return `${p.y}${pad(p.m)}${pad(p.day)}T${pad(p.hh)}${pad(p.mm)}00`;
    };
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${fmt(start)}/${fmt(end)}`,
        details,
        location: [ev.venue, ev.address].filter(Boolean).join(' - '),
        ctz: 'Asia/Ho_Chi_Minh',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Ảnh QR VietQR (compact2). addInfo tối đa 50 ký tự, không dấu.
 * @param {{bankBin: string, accountNo: string, accountName?: string}} acc
 * @param {string} addInfo
 * @returns {string}
 */
export const vietQrUrl = (acc, addInfo) => {
    const info = util.removeDiacritics(addInfo).replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50);
    const name = util.removeDiacritics(acc.accountName ?? '').toUpperCase();
    const q = new URLSearchParams({ addInfo: info, accountName: name });
    return `https://img.vietqr.io/image/${encodeURIComponent(acc.bankBin)}-${encodeURIComponent(acc.accountNo)}-compact2.png?${q.toString()}`;
};
