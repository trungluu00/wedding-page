// Định dạng ngày giờ kiểu Việt Nam, link Google Calendar, link QR VietQR.
// Tự tính theo múi giờ +07:00 (không phụ thuộc dữ liệu ngôn ngữ của trình duyệt trong app).
import { util } from './util.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']; // viết như thiệp in

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

/** "Chủ Nhật, ngày 10 tháng 01 năm 2027" */
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
 * Link "Thêm vào Google Calendar". Thời lượng mặc định 3 giờ; sự kiện chưa có giờ → cả ngày.
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
    const allDay = !String(ev.time || '').trim();
    const end = new Date(start.getTime() + (allDay ? 24 : 3) * 60 * 60 * 1000);
    const fmt = (d) => {
        const p = vnParts(d);
        const day = `${p.y}${pad(p.m)}${pad(p.day)}`;
        return allDay ? day : `${day}T${pad(p.hh)}${pad(p.mm)}00`;
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
 * File lịch .ics (app Lịch trên iPhone / Mac / Outlook). Chưa có giờ → sự kiện cả ngày.
 * Nhắc trước 1 ngày.
 * @returns {string|null}
 */
export const icsFile = (ev, title, details) => {
    const start = eventDate(ev);
    if (!start) {
        return null;
    }
    const allDay = !String(ev.time || '').trim();
    const end = new Date(start.getTime() + (allDay ? 24 : 3) * 60 * 60 * 1000);
    const day = (d) => {
        const p = vnParts(d);
        return `${p.y}${pad(p.m)}${pad(p.day)}`;
    };
    const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
    // Chuẩn iCalendar: mỗi dòng tối đa 75 byte, dòng dài gấp xuống dòng mới bắt đầu bằng dấu cách
    // (tiếng Việt có dấu 2–3 byte/chữ nên đếm theo byte UTF-8, không cắt giữa một chữ).
    const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    const fold = (line) => {
        if (!enc || enc.encode(line).length <= 75) return line;
        const out = [];
        let cur = '';
        let bytes = 0;
        for (const ch of line) {
            const b = enc.encode(ch).length;
            if (bytes + b > (out.length ? 74 : 75)) {
                out.push(cur);
                cur = '';
                bytes = 0;
            }
            cur += ch;
            bytes += b;
        }
        out.push(cur);
        return out.join('\r\n ');
    };
    return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//thiep-cuoi//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${ev.id || 'su-kien'}-${day(start)}@thiep-cuoi`,
        `DTSTAMP:${utc(new Date())}`,
        allDay ? `DTSTART;VALUE=DATE:${day(start)}` : `DTSTART:${utc(start)}`,
        allDay ? `DTEND;VALUE=DATE:${day(end)}` : `DTEND:${utc(end)}`,
        `SUMMARY:${esc(title)}`,
        `DESCRIPTION:${esc(details)}`,
        `LOCATION:${esc([ev.venue, ev.address].filter(Boolean).join(' - '))}`,
        // Nhắc trước 1 ngày (nhắc trước 3 tiếng thì Lễ Vu Quy 06:00 sẽ báo lúc 03:00 sáng)
        'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR', '',
    ].map(fold).join('\r\n');
};

/**
 * Ảnh QR VietQR (compact2). addInfo tối đa 50 ký tự, không dấu.
 * @param {{bankBin: string, accountNo: string, accountName?: string}} acc
 * @param {string} addInfo
 * @returns {string}
 */
export const vietQrUrl = (acc, addInfo) => {
    let info = util.removeDiacritics(addInfo).replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (info.length > 50) {
        // tối đa 50 ký tự, cắt ở khoảng trắng để không đứt giữa chữ
        const cut = info.slice(0, 51).lastIndexOf(' ');
        info = info.slice(0, cut > 20 ? cut : 50).trim();
    }
    const name = util.removeDiacritics(acc.accountName ?? '').toUpperCase();
    const q = new URLSearchParams({ addInfo: info, accountName: name });
    // Số tài khoản bỏ dấu cách / dấu chấm (vd "4444 5555 66") — VietQR chỉ nhận chữ số liền
    const no = String(acc.accountNo ?? '').replace(/[^0-9A-Za-z]/g, '');
    return `https://img.vietqr.io/image/${encodeURIComponent(acc.bankBin)}-${encodeURIComponent(no)}-compact2.png?${q.toString()}`;
};
