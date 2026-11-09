/**
 * ============================================================================
 *  BACKEND THIỆP CƯỚI — Google Apps Script (gắn vào một Google Sheet)
 * ============================================================================
 *  Cài đặt (chi tiết trong README.md):
 *   1. Tạo Google Sheet mới → Tiện ích mở rộng → Apps Script → dán toàn bộ file này.
 *   2. Chạy hàm setupDatabase() một lần (cấp quyền khi được hỏi).
 *   3. Điền tên miền thiệp vào ô B1 của sheet "CauHinh".
 *   4. Triển khai → Tùy chọn triển khai mới → Ứng dụng web:
 *        Thực thi với tư cách: Tôi · Người có quyền truy cập: Bất kỳ ai (Anyone)
 *   5. Dán URL /exec vào backend.appsScriptUrl trong wedding.config.js.
 *
 *  Hợp đồng API (dùng chung cho hướng A và hướng B):
 *   GET  ?action=lookup&code=xxx → {success:true, found:true, data:{code,name,xungHo,side,groups:[]}} | {success:true, found:false}
 *   GET  ?action=wishes          → {success:true, data:[{author,relation,text,createdAt}]}  (cột Hiện = TRUE, mới nhất trước, tối đa 200, cache 60s)
 *   POST (Content-Type: text/plain, body JSON)
 *        {action:"rsvp", code, name, side, willAttend, guestCount, notes, hp}
 *        {action:"wish", code, author, relation, text, hp}
 *        {action:"open", code}
 *        → {success:true} | {success:false, message}
 * ============================================================================
 */

var SHEETS = {
  guests: 'KhachMoi',
  rsvp: 'RSVP',
  wishes: 'LoiChuc',
  opens: 'LuotMo',
  config: 'CauHinh',
};

var GUEST_HEADERS = ['code', 'name', 'xungHo', 'side', 'groups', 'phone', 'notes', 'link', 'rsvpStatus', 'guestCount'];
var RSVP_HEADERS = ['createdAt', 'code', 'name', 'side', 'willAttend', 'guestCount', 'notes'];
var WISH_HEADERS = ['createdAt', 'code', 'author', 'relation', 'text', 'Hiện'];
var OPEN_HEADERS = ['createdAt', 'code', 'name'];

var LIMITS = { name: 80, relation: 80, text: 500, notes: 500, maxGuests: 10 };
var WISHES_CACHE_KEY = 'wishes_v1';
var WISHES_CACHE_SECONDS = 60;
var WISHES_MAX = 200;

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || '');
    if (action === 'lookup') return json_(lookupGuest_(p.code));
    if (action === 'wishes') return json_(getWishes_());
    return json_({ success: false, message: 'Hành động không hợp lệ' });
  } catch (err) {
    return json_({ success: false, message: 'Lỗi máy chủ' });
  }
}

function doPost(e) {
  try {
    var body = {};
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (parseErr) {
      return json_({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    var action = String(body.action || '');
    if (action === 'rsvp') return json_(withLock_(function () { return saveRsvp_(body); }));
    if (action === 'wish') return json_(withLock_(function () { return saveWish_(body); }));
    if (action === 'open') return json_(withLock_(function () { return saveOpen_(body); }));
    return json_({ success: false, message: 'Hành động không hợp lệ' });
  } catch (err) {
    return json_({ success: false, message: 'Lỗi máy chủ, vui lòng thử lại' });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { success: false, message: 'Hệ thống đang bận, vui lòng thử lại' };
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------
function lookupGuest_(rawCode) {
  var code = normalizeCode_(rawCode);
  if (!code) return { success: true, found: false };
  var found = findGuestRow_(code);
  if (!found) return { success: true, found: false };
  var r = found.values;
  var col = headerIndex_(GUEST_HEADERS);
  return {
    success: true,
    found: true,
    data: {
      code: String(r[col.code]),
      name: String(r[col.name] || ''),
      xungHo: String(r[col.xungHo] || ''),
      side: generateSlug(r[col.side] || ''),
      groups: String(r[col.groups] || '')
        .split(',')
        .map(function (g) { return generateSlug(g); })
        .filter(function (g) { return g; }),
    },
  };
}

function getWishes_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(WISHES_CACHE_KEY);
  if (cached) return { success: true, data: JSON.parse(cached) };

  var sheet = getSheet_(SHEETS.wishes);
  var last = sheet.getLastRow();
  var data = [];
  if (last >= 2) {
    var rows = sheet.getRange(2, 1, last - 1, WISH_HEADERS.length).getValues();
    for (var i = rows.length - 1; i >= 0 && data.length < WISHES_MAX; i--) {
      var r = rows[i];
      var show = r[5] === true || String(r[5]).toUpperCase() === 'TRUE';
      if (!show || !r[2] || !r[4]) continue;
      data.push({
        author: String(r[2]),
        relation: String(r[3] || ''),
        text: String(r[4]),
        createdAt: Object.prototype.toString.call(r[0]) === '[object Date]' ? r[0].toISOString() : String(r[0]),
      });
    }
  }
  // mới nhất trước (theo thời gian, phòng khi sheet bị sắp xếp lại)
  data.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0; });
  try {
    cache.put(WISHES_CACHE_KEY, JSON.stringify(data), WISHES_CACHE_SECONDS);
  } catch (cacheErr) {
    /* dữ liệu quá 100KB thì bỏ qua cache */
  }
  return { success: true, data: data };
}

// ---------------------------------------------------------------------------
// Ghi
// ---------------------------------------------------------------------------
function saveRsvp_(b) {
  if (!isHumanRequest_(b)) return { success: true }; // bot: giả vờ thành công, không ghi
  var name = cleanText_(b.name, LIMITS.name);
  if (!name) return { success: false, message: 'Vui lòng nhập họ tên' };
  if (String(b.name || '').trim().length > LIMITS.name) return { success: false, message: 'Tên quá dài (tối đa 80 ký tự)' };
  var willAttend = b.willAttend === true || b.willAttend === 'true' || b.willAttend === 'yes';
  var count = parseInt(b.guestCount, 10);
  if (isNaN(count)) count = willAttend ? 1 : 0;
  if (count < 0 || count > LIMITS.maxGuests) return { success: false, message: 'Số người không hợp lệ (0–10)' };
  if (!willAttend) count = 0;
  var code = normalizeCode_(b.code);
  var side = generateSlug(b.side || '').slice(0, 30);
  var notes = cleanText_(b.notes, LIMITS.notes);

  getSheet_(SHEETS.rsvp).appendRow([new Date(), code, safeCell_(name), side, willAttend, count, safeCell_(notes)]);

  // Cập nhật trạng thái trên danh sách khách mời
  if (code) {
    var found = findGuestRow_(code);
    if (found) {
      var col = headerIndex_(GUEST_HEADERS);
      var sheet = getSheet_(SHEETS.guests);
      sheet.getRange(found.row, col.rsvpStatus + 1).setValue(willAttend ? 'Có' : 'Không');
      sheet.getRange(found.row, col.guestCount + 1).setValue(count);
    }
  }
  return { success: true };
}

function saveWish_(b) {
  if (!isHumanRequest_(b)) return { success: true };
  var author = cleanText_(b.author, LIMITS.name);
  var text = cleanText_(b.text, LIMITS.text);
  if (!author || !text) return { success: false, message: 'Vui lòng nhập tên và lời chúc' };
  if (String(b.author || '').trim().length > LIMITS.name) return { success: false, message: 'Tên quá dài (tối đa 80 ký tự)' };
  if (String(b.text || '').trim().length > LIMITS.text) return { success: false, message: 'Lời chúc quá dài (tối đa 500 ký tự)' };
  var relation = cleanText_(b.relation, LIMITS.relation);

  getSheet_(SHEETS.wishes).appendRow([new Date(), normalizeCode_(b.code), safeCell_(author), safeCell_(relation), safeCell_(text), true]);
  CacheService.getScriptCache().remove(WISHES_CACHE_KEY);
  return { success: true };
}

function saveOpen_(b) {
  var code = normalizeCode_(b.code);
  if (!code) return { success: false, message: 'Thiếu mã khách' };
  var found = findGuestRow_(code);
  if (!found) return { success: false, message: 'Không tìm thấy khách' };
  var col = headerIndex_(GUEST_HEADERS);
  getSheet_(SHEETS.opens).appendRow([new Date(), code, safeCell_(String(found.values[col.name] || ''))]);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------
function isHumanRequest_(b) {
  // hp = ô bẫy ẩn trên form; người thật không điền
  return !b.hp || String(b.hp).trim() === '';
}

function cleanText_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

/** Chặn "công thức" do khách nhập (=, +, -, @) bị Sheets thực thi. */
function safeCell_(s) {
  s = String(s || '');
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function normalizeCode_(v) {
  var code = String(v || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(code) ? code : '';
}

/**
 * Sinh mã (slug) từ tiếng Việt có dấu: "Bác Hùng" → "bac-hung".
 */
function generateSlug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function headerIndex_(headers) {
  var idx = {};
  headers.forEach(function (h, i) { idx[h] = i; });
  return idx;
}

function getSheet_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Chưa có sheet ' + name + ' — hãy chạy setupDatabase()');
  return sheet;
}

function findGuestRow_(code) {
  var sheet = getSheet_(SHEETS.guests);
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var rows = sheet.getRange(2, 1, last - 1, GUEST_HEADERS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === code) return { row: i + 2, values: rows[i] };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Khởi tạo & tiện ích cho người quản lý Sheet
// ---------------------------------------------------------------------------
/** Chạy MỘT LẦN để tạo các sheet và tiêu đề cột. Chạy lại không làm mất dữ liệu. */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cfg = ensureSheet_(ss, SHEETS.config, ['Tên miền thiệp (không có / ở cuối)', 'https://TODO.pages.dev']);
  cfg.setColumnWidth(1, 280);
  cfg.setColumnWidth(2, 320);

  var guests = ensureSheet_(ss, SHEETS.guests, GUEST_HEADERS);
  // Cột link tự ghép tên miền + ?to= + code cho mọi dòng
  var linkCol = GUEST_HEADERS.indexOf('link') + 1;
  guests
    .getRange(1, linkCol)
    .setFormula('={"link"; ARRAYFORMULA(IF(A2:A="", "", ' + SHEETS.config + '!$B$1 & "/?to=" & A2:A))}');
  var sideRule = SpreadsheetApp.newDataValidation().requireValueInList(['nha-trai', 'nha-gai', 'ban-chung'], true).setAllowInvalid(true).build();
  guests.getRange(2, GUEST_HEADERS.indexOf('side') + 1, guests.getMaxRows() - 1, 1).setDataValidation(sideRule);
  guests.getRange(1, 1).setNote('Để trống code: hệ thống tự sinh từ xưng hô + tên khi bạn nhập tên (hoặc chạy fillMissingCodes).');
  guests.getRange(1, GUEST_HEADERS.indexOf('groups') + 1).setNote('Các nhóm cách nhau dấu phẩy, vd: gia-dinh, ban-be. Khớp với audience trong wedding.config.js');

  ensureSheet_(ss, SHEETS.rsvp, RSVP_HEADERS);
  var wishes = ensureSheet_(ss, SHEETS.wishes, WISH_HEADERS);
  wishes.getRange(2, WISH_HEADERS.length, wishes.getMaxRows() - 1, 1).insertCheckboxes();
  wishes.getRange(1, WISH_HEADERS.length).setNote('Bỏ tick để ẩn lời chúc khỏi thiệp (cập nhật sau tối đa 60 giây).');
  ensureSheet_(ss, SHEETS.opens, OPEN_HEADERS);

  // Khách mẫu để thử link mời
  if (guests.getLastRow() < 2) {
    guests.getRange(2, 1, 2, 7).setValues([
      ['bac-hung', 'Hùng', 'Bác', 'nha-trai', 'gia-dinh', '', 'Khách mẫu — xóa khi dùng thật'],
      ['ban-lan', 'Lan', 'Bạn', 'nha-gai', 'ban-be', '', 'Khách mẫu — xóa khi dùng thật'],
    ]);
  }
  SpreadsheetApp.getUi().alert('Đã tạo xong các sheet. Nhớ điền tên miền vào CauHinh!B1 rồi triển khai Web App.');
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Sinh code cho mọi khách chưa có code (từ xưng hô + tên), đảm bảo không trùng. */
function fillMissingCodes() {
  var sheet = getSheet_(SHEETS.guests);
  var last = sheet.getLastRow();
  if (last < 2) return;
  var range = sheet.getRange(2, 1, last - 1, 3);
  var rows = range.getValues();
  var used = {};
  rows.forEach(function (r) { if (r[0]) used[String(r[0]).toLowerCase()] = true; });
  rows.forEach(function (r, i) {
    if (r[0] || !r[1]) return;
    var base = generateSlug((r[2] ? r[2] + ' ' : '') + r[1]) || 'khach';
    var code = base;
    var n = 2;
    while (used[code]) code = base + '-' + n++;
    used[code] = true;
    sheet.getRange(i + 2, 1).setValue(code);
  });
}

/** Tự sinh code khi nhập tên/xưng hô vào sheet KhachMoi (trigger đơn giản). */
function onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    if (sheet.getName() !== SHEETS.guests || e.range.getRow() < 2) return;
    var col = e.range.getColumn();
    if (col !== 2 && col !== 3) return;
    fillMissingCodes();
  } catch (err) {
    /* bỏ qua */
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💌 Thiệp cưới')
    .addItem('Tạo / kiểm tra các sheet', 'setupDatabase')
    .addItem('Sinh code cho khách còn trống', 'fillMissingCodes')
    .addToUi();
}
