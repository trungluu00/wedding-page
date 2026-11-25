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
 *   GET  ?action=settings        → {success:true, data:{events:{<id>:{time}}, accounts:[{family,bankBin,bankName,accountNo,accountName,qrImage}], texts:{quote,groomBio,brideBio}}}
 *                                  (đọc sheet CauHinh, cột C là khóa; cache 60s, sửa CauHinh là xóa cache)
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
// Hai cột ô tick ở đầu sheet KhachMoi (menu 💌 Thiệp cưới → Thêm cột ô tick): "Đã mời" (đã gửi thiệp) và
// "Mời offline" (tick = mời trực tiếp / thiệp giấy, để trống = mời online qua link). Script tìm mọi cột theo chữ
// tiêu đề (guestCols_), nên đừng đổi chữ ở dòng 1.
var INVITED_HEADER = 'Đã mời';
var OFFLINE_HEADER = 'Mời offline';
var FADED_TEXT = '#a3a8ad'; // chữ xám nhạt: dòng đã mời
var OFFLINE_FILL = '#e3eaf3'; // nền xanh xám nhạt: dòng mời offline
var RSVP_HEADERS = ['createdAt', 'code', 'name', 'side', 'willAttend', 'guestCount', 'notes'];
var WISH_HEADERS = ['createdAt', 'code', 'author', 'relation', 'text', 'Hiện'];
var OPEN_HEADERS = ['createdAt', 'code', 'name'];

var LIMITS = { name: 80, relation: 80, text: 500, notes: 500, maxGuests: 10 };
var WISHES_CACHE_KEY = 'wishes_v1';
var WISHES_CACHE_SECONDS = 60;
var WISHES_MAX = 200;
var SETTINGS_CACHE_KEY = 'settings_v1';

/**
 * Các dòng cấu hình trong sheet CauHinh: [mô tả, giá trị mặc định, khóa]. Khóa null = dòng tiêu đề nhóm.
 * Khóa "time:<id sự kiện>" khớp id trong wedding.config.js; "bank:<nhà>:<trường>" cho mục mừng cưới.
 */
var SETTING_ROWS = [
  ['GIỜ SỰ KIỆN — gõ dạng 17:30 hoặc 17h30; để trống thì thiệp chỉ hiện ngày', null, null],
  ['Bữa cơm thân mật nhà trai · Thứ Bảy 12/12/2026', '', 'time:tiec-nha-trai'],
  ['Bữa cơm thân mật nhà gái · Thứ Bảy 12/12/2026', '', 'time:tiec-nha-gai'],
  ['Lễ Vu Quy (nhà gái) · Chủ nhật 13/12/2026', '06:00', 'time:le-vu-quy'],
  ['Lễ Thành Hôn (nhà trai) · Chủ nhật 13/12/2026', '10:00', 'time:le-thanh-hon'],
  ['MỪNG CƯỚI — điền số tài khoản thì thiệp tự tạo mã QR (VietQR); để trống thì ẩn mục mừng cưới', null, null],
  ['Chú rể · Ngân hàng (chọn trong danh sách, hoặc gõ mã BIN 6 số)', '', 'bank:nha-trai:bank'],
  ['Chú rể · Số tài khoản', '', 'bank:nha-trai:accountNo'],
  ['Chú rể · Tên chủ tài khoản (IN HOA, không dấu)', 'LUU VIET TRUNG', 'bank:nha-trai:accountName'],
  ['Chú rể · Link ảnh QR riêng (không bắt buộc, vd link Google Drive đã chia sẻ công khai)', '', 'bank:nha-trai:qrImage'],
  ['Cô dâu · Ngân hàng (chọn trong danh sách, hoặc gõ mã BIN 6 số)', '', 'bank:nha-gai:bank'],
  ['Cô dâu · Số tài khoản', '', 'bank:nha-gai:accountNo'],
  ['Cô dâu · Tên chủ tài khoản (IN HOA, không dấu)', 'DOAN PHUONG NHI', 'bank:nha-gai:accountName'],
  ['Cô dâu · Link ảnh QR riêng (không bắt buộc, vd link Google Drive đã chia sẻ công khai)', '', 'bank:nha-gai:qrImage'],
  ['LỜI TRÊN THIỆP — sửa thoải mái; để trống ô nào thì thiệp dùng lời mặc định', null, null],
  ['Câu trích phía trên lời mời', 'Từ một lời hẹn ngày dạm ngõ, thành một đời thương nhau.', 'text:quote'],
  ['Giới thiệu chú rể (mục Cặp đôi)', 'Chàng trai hiền lành, chân thành, ít nói nhưng luôn chu đáo. Với Trung, Nhi là người khiến những ngày bình thường trở nên đặc biệt.', 'text:groomBio'],
  ['Giới thiệu cô dâu (mục Cặp đôi)', 'Cô gái dịu dàng, hay cười và luôn quan tâm mọi người xung quanh. Với Nhi, Trung là bến bình yên để trở về sau mỗi ngày dài.', 'text:brideBio'],
];

/** Tên ngân hàng → mã BIN (NAPAS) dùng cho VietQR. */
var BANKS = {
  'Vietcombank': '970436', 'VietinBank': '970415', 'BIDV': '970418', 'Agribank': '970405',
  'Techcombank': '970407', 'MB Bank': '970422', 'ACB': '970416', 'VPBank': '970432',
  'TPBank': '970423', 'Sacombank': '970403', 'VIB': '970441', 'HDBank': '970437',
  'SHB': '970443', 'MSB': '970426', 'OCB': '970448', 'SeABank': '970440',
  'LPBank': '970449', 'Eximbank': '970431', 'Nam A Bank': '970428', 'SCB': '970429',
  'PVcomBank': '970412', 'Bac A Bank': '970409', 'ABBANK': '970425', 'Kienlongbank': '970452',
  'NCB': '970419', 'VietABank': '970427', 'BVBank': '970454', 'Cake by VPBank': '546034',
};

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || '');
    if (action === 'lookup') return json_(lookupGuest_(p.code));
    if (action === 'wishes') return json_(getWishes_());
    if (action === 'settings') return json_(getSettings_());
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
  var v = function (key) { return found.values[found.cols[key] - 1]; };
  return {
    success: true,
    found: true,
    data: {
      code: String(v('code')),
      name: String(v('name') || ''),
      xungHo: String(v('xungHo') || ''),
      side: generateSlug(v('side') || ''),
      groups: String(v('groups') || '')
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

/** Giờ sự kiện + tài khoản mừng cưới từ sheet CauHinh (cột C là khóa). */
function getSettings_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(SETTINGS_CACHE_KEY);
  if (cached) return { success: true, data: JSON.parse(cached) };

  var sheet = getSheet_(SHEETS.config);
  var last = sheet.getLastRow();
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var events = {};
  var banks = {};
  var texts = {};
  if (last >= 1) {
    sheet.getRange(1, 1, last, 3).getValues().forEach(function (r) {
      var key = String(r[2] || '').trim();
      var m = key.match(/^time:([a-z0-9-]+)$/);
      if (m) {
        var t = normalizeTime_(r[1], tz);
        if (t !== null) events[m[1]] = { time: t };
        return;
      }
      m = key.match(/^bank:(nha-trai|nha-gai):(bank|accountNo|accountName|qrImage)$/);
      if (m) {
        banks[m[1]] = banks[m[1]] || {};
        banks[m[1]][m[2]] = String(r[1] == null ? '' : r[1]).trim();
        return;
      }
      m = key.match(/^text:(quote|groomBio|brideBio)$/);
      if (m) {
        var t = String(r[1] == null ? '' : r[1]).replace(/\s+/g, ' ').trim().slice(0, 600);
        if (t) texts[m[1]] = t; // ô trống → thiệp dùng lời mặc định
      }
    });
  }
  var accounts = ['nha-trai', 'nha-gai'].filter(function (f) { return banks[f]; }).map(function (f) {
    var b = banks[f];
    var bank = resolveBank_(b.bank || '');
    return {
      family: f,
      bankBin: bank.bin,
      bankName: bank.name,
      accountNo: String(b.accountNo || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 30),
      accountName: String(b.accountName || '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, 60),
      qrImage: publicImageUrl_(b.qrImage || ''),
    };
  });
  var data = { events: events, accounts: accounts, texts: texts };
  try {
    cache.put(SETTINGS_CACHE_KEY, JSON.stringify(data), WISHES_CACHE_SECONDS);
  } catch (cacheErr) {
    /* bỏ qua */
  }
  return { success: true, data: data };
}

/** "17:30" | "17h30" | "17h" | ô kiểu giờ của Sheet → "HH:mm"; ô trống → ""; viết sai → null (giữ giờ trong config). */
function normalizeTime_(v, tz) {
  if (v === '' || v == null) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, tz, 'HH:mm');
  var m = String(v).trim().toLowerCase().match(/^(\d{1,2})\s*(?::|h|g|\.|giờ)\s*(\d{2})?\s*(?:phút|p)?$/);
  if (!m) return null;
  var h = parseInt(m[1], 10);
  var min = m[2] ? parseInt(m[2], 10) : 0;
  if (h > 23 || min > 59) return null;
  return (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min;
}

function resolveBank_(raw) {
  var v = String(raw || '').trim();
  if (!v) return { bin: '', name: '' };
  var names = Object.keys(BANKS);
  if (/^\d{6}$/.test(v)) {
    var byBin = names.filter(function (n) { return BANKS[n] === v; })[0];
    return { bin: v, name: byBin || '' };
  }
  var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); };
  var hit = names.filter(function (n) { return norm(n) === norm(v); })[0];
  return hit ? { bin: BANKS[hit], name: hit } : { bin: v, name: v }; // VietQR cũng nhận mã viết tắt (vd "vcb")
}

/** Chỉ nhận link https; link Google Drive được đổi sang link ảnh xem trực tiếp. */
function publicImageUrl_(raw) {
  var v = String(raw || '').trim();
  if (!/^https:\/\//i.test(v)) return '';
  var m = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
  if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000';
  return v.slice(0, 500);
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

  appendRowSafe_(getSheet_(SHEETS.rsvp), [new Date(), code, safeCell_(name), side, willAttend, count, safeCell_(notes)]);

  // Cập nhật trạng thái trên danh sách khách mời
  if (code) {
    var found = findGuestRow_(code);
    if (found) {
      found.sheet.getRange(found.row, found.cols.rsvpStatus).setValue(willAttend ? 'Có' : 'Không');
      found.sheet.getRange(found.row, found.cols.guestCount).setValue(count);
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

  var wishes = getSheet_(SHEETS.wishes);
  var row = appendRowSafe_(wishes, [new Date(), normalizeCode_(b.code), safeCell_(author), safeCell_(relation), safeCell_(text), true]);
  var showCell = wishes.getRange(row, WISH_HEADERS.length);
  showCell.insertCheckboxes();
  showCell.check();
  CacheService.getScriptCache().remove(WISHES_CACHE_KEY);
  return { success: true };
}

function saveOpen_(b) {
  var code = normalizeCode_(b.code);
  if (!code) return { success: false, message: 'Thiếu mã khách' };
  var found = findGuestRow_(code);
  if (!found) return { success: false, message: 'Không tìm thấy khách' };
  appendRowSafe_(getSheet_(SHEETS.opens), [new Date(), code, safeCell_(String(found.values[found.cols.name - 1] || ''))]);
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
    .replace(/<[^>]*>/g, '') // lời chúc chỉ là chữ thường, bỏ thẻ HTML
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

/**
 * Vị trí các cột của sheet KhachMoi (đếm từ 1), tìm theo chữ ở dòng tiêu đề — nên chèn thêm cột (vd cột "Đã mời"
 * ở đầu) hay đổi chỗ cột không làm hỏng script. Cột link nhận ra bằng công thức của nó (ô tiêu đề có thể đang báo
 * #REF!). Tiêu đề nào không tìm thấy thì coi như các cột nằm liền nhau theo thứ tự GUEST_HEADERS, bắt đầu từ cột code.
 * cols.invited / cols.offline = vị trí cột ô tick "Đã mời" / "Mời offline" (0 = chưa có);
 * cols.width = số cột cần đọc cho một dòng khách.
 */
function guestCols_(sheet) {
  var width = Math.max(sheet.getLastColumn(), GUEST_HEADERS.length);
  var head = sheet.getRange(1, 1, 1, width);
  var names = head.getDisplayValues()[0].map(function (s) { return String(s || '').trim().toLowerCase(); });
  var formulas = head.getFormulas()[0];
  var invited = names.indexOf(INVITED_HEADER.toLowerCase());
  var offline = names.indexOf(OFFLINE_HEADER.toLowerCase());
  var base = names.indexOf('code');
  if (base === -1) {
    // Không thấy tiêu đề "code": cột code nằm ngay sau các cột ô tick ở đầu (nếu có)
    base = 0;
    while (base === invited || base === offline) base++;
  }
  var cols = { width: width, invited: invited + 1, offline: offline + 1 };
  GUEST_HEADERS.forEach(function (h, i) {
    var at = -1;
    if (h === 'link') {
      for (var j = 0; j < width; j++) {
        if (String(formulas[j]).indexOf('/?to=') !== -1) { at = j; break; }
      }
    }
    if (at === -1) at = names.indexOf(h.toLowerCase());
    cols[h] = (at === -1 ? base + i : at) + 1;
  });
  cols.width = Math.max(width, cols.guestCount, cols.link);
  return cols;
}

/** 1 → "A", 27 → "AA". */
function colLetter_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Dòng ngay sau dòng cuối có dữ liệu ở cột A. Không dùng appendRow vì ô checkbox / định dạng trống
 * làm getLastRow() trỏ tới cuối sheet → dữ liệu mới bị ghi tận dòng 1000+.
 */
function nextEmptyRow_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return 2;
  var colA = sheet.getRange(1, 1, last, 1).getValues();
  for (var i = colA.length - 1; i >= 1; i--) {
    if (colA[i][0] !== '' && colA[i][0] !== null) return i + 2;
  }
  return 2;
}

function appendRowSafe_(sheet, values) {
  var row = nextEmptyRow_(sheet);
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  return row;
}

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    // Lần dùng đầu tiên (chưa chạy setupDatabase): tự tạo các sheet
    setupCore_();
    sheet = ss.getSheetByName(name);
  }
  if (!sheet) throw new Error('Không tạo được sheet ' + name);
  return sheet;
}

/** Tìm khách theo mã → {sheet, row, cols, values: cả dòng (values[cols.xxx - 1])} hoặc null. */
function findGuestRow_(code) {
  var sheet = getSheet_(SHEETS.guests);
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var cols = guestCols_(sheet);
  var codes = sheet.getRange(2, cols.code, last - 1, 1).getValues();
  for (var i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).trim().toLowerCase() === code) {
      var row = i + 2;
      return { sheet: sheet, row: row, cols: cols, values: sheet.getRange(row, 1, 1, cols.width).getValues()[0] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Khởi tạo & tiện ích cho người quản lý Sheet
// ---------------------------------------------------------------------------
/** Tạo các sheet còn thiếu (lần cài đầu). Sheet đã có thì không ghi đè gì — xem setupCore_. */
function setupDatabase() {
  setupCore_();
  var msg = 'Đã tạo các sheet còn thiếu (sheet đã có giữ nguyên). Lần cài đầu: điền tên miền vào CauHinh!B1 rồi triển khai Web App.';
  try {
    SpreadsheetApp.getUi().alert(msg); // chỉ có khi chạy từ menu trong Google Sheet
  } catch (uiErr) {
    Logger.log(msg); // chạy từ trình soạn Apps Script: xem ở "Nhật ký thực thi"
  }
}

/**
 * Đặt công thức không phụ thuộc ngôn ngữ của Sheet: Sheet tiếng Việt (và các nước dùng dấu phẩy thập phân)
 * ngăn đối số bằng ";" thay vì ",". Thử "," trước, nếu Sheet báo lỗi cú pháp thì đổi sang ";".
 */
function setLocaleFormula_(range, formula) {
  range.setFormula(formula);
  SpreadsheetApp.flush();
  if (String(range.getDisplayValue()).indexOf('#') === 0) {
    // chỉ đổi dấu phẩy nằm ngoài chuỗi "..."
    range.setFormula(formula.replace(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g, ';'));
  }
}

/**
 * Tạo các sheet còn thiếu. Sheet đã có thì KHÔNG ghi đè gì (giá trị, công thức, ô tick, định dạng) — chỉ thêm
 * các dòng cấu hình còn thiếu ở cuối CauHinh. Dữ liệu thật đang dùng nên script không bao giờ sửa / xóa ô đã có.
 */
function setupCore_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cfgIsNew = !ss.getSheetByName(SHEETS.config);
  var cfg = ensureSheet_(ss, SHEETS.config, ['Tên miền thiệp (không có / ở cuối)', 'https://TODO.pages.dev']);
  if (cfgIsNew) {
    cfg.setColumnWidth(1, 280);
    cfg.setColumnWidth(2, 420);
    // Link theo nhà: gửi chung cho bạn bè / đồng nghiệp của mỗi bên (không cần mã khách)
    cfg.getRange(3, 1, 2, 1).setValues([['Link thiệp nhà trai'], ['Link thiệp nhà gái']]);
    cfg.getRange(3, 2).setFormula('=B1 & "/?ben=nha-trai"');
    cfg.getRange(4, 2).setFormula('=B1 & "/?ben=nha-gai"');
  }
  setupSettingRows_(cfg); // chỉ thêm dòng còn thiếu, không đụng dòng đã có

  var guestsIsNew = !ss.getSheetByName(SHEETS.guests);
  var guests = ensureSheet_(ss, SHEETS.guests, GUEST_HEADERS);
  if (guestsIsNew) {
    var gc = guestCols_(guests);
    // Cột link tự ghép tên miền + ?to= + code cho mọi dòng
    setLinkFormula_(guests, gc);
    var sideRule = SpreadsheetApp.newDataValidation().requireValueInList(['nha-trai', 'nha-gai', 'ban-chung'], true).setAllowInvalid(true).build();
    guests.getRange(2, gc.side, guests.getMaxRows() - 1, 1).setDataValidation(sideRule);
    guests.getRange(1, gc.code).setNote('Để trống code: tự sinh khi bạn nhập tên, dạng xưng-hô-tên + 3 ký tự ngẫu nhiên (vd bac-hung-7k2) để khó đoán.');
    guests.getRange(1, gc.link).setNote('Cột tự ghép link mời — đừng gõ hay dán gì vào cột này.');
    guests.getRange(1, gc.groups).setNote('Các nhóm cách nhau dấu phẩy, vd: gia-dinh, ban-be. Khớp với audience trong wedding.config.js');
    // Khách mẫu để thử link mời — chỉ khi vừa tạo sheet
    guests.getRange(2, gc.code, 2, 7).setValues([
      ['bac-hung-7k2', 'Hùng', 'Bác', 'nha-trai', 'gia-dinh', '', 'Khách mẫu — xóa khi dùng thật'],
      ['ban-lan-3x9', 'Lan', 'Bạn', 'nha-gai', 'ban-be', '', 'Khách mẫu — xóa khi dùng thật'],
    ]);
  }

  ensureSheet_(ss, SHEETS.rsvp, RSVP_HEADERS);
  var wishesIsNew = !ss.getSheetByName(SHEETS.wishes);
  var wishes = ensureSheet_(ss, SHEETS.wishes, WISH_HEADERS);
  if (wishesIsNew) wishes.getRange(1, WISH_HEADERS.length).setNote('Bỏ tick để ẩn lời chúc khỏi thiệp (cập nhật sau tối đa 60 giây).');
  ensureSheet_(ss, SHEETS.opens, OPEN_HEADERS);
}

/**
 * Công thức ở ô tiêu đề cột link: link mời = tên miền + ?to=mã + &n=tên có dấu (thiệp hiện đúng tên ngay cả khi
 * chưa tra được Sheet). Chữ cột (A/B/C…) lấy theo vị trí thật của cột code, name, xungHo.
 */
function linkFormula_(cols) {
  var c = colLetter_(cols.code), n = colLetter_(cols.name), x = colLetter_(cols.xungHo);
  var r = function (L) { return L + '2:' + L; };
  return '={"link"; ARRAYFORMULA(IF(' + r(c) + '="", "", ' + SHEETS.config + '!$B$1 & "/?to=" & ' + r(c) +
    ' & "&n=" & ENCODEURL(TRIM(' + r(x) + ' & " " & ' + r(n) + '))))}';
}

function setLinkFormula_(guests, cols) {
  cols = cols || guestCols_(guests);
  setLocaleFormula_(guests.getRange(1, cols.link), linkFormula_(cols));
}

/** Công thức ở ô tiêu đề cột link đang chạy bình thường (tự ghép link cho mọi dòng)? */
function linkFormulaWorks_(guests, cols) {
  var head = guests.getRange(1, cols.link);
  return !!head.getFormula() && String(head.getDisplayValue()).trim().indexOf('#') !== 0;
}

/**
 * CHỈ THÊM: ghi link mời vào những ô link CÒN TRỐNG của các dòng đã có code — dùng khi công thức ở ô tiêu đề
 * cột link không chạy được (vd báo #REF! vì trong cột đã có link dán dạng chữ / ghi chú). Không sửa, không xóa
 * ô nào đã có chữ. Công thức đang chạy bình thường thì không làm gì (công thức tự ghép link).
 * Link giống hệt công thức: tên miền (CauHinh!B1) + /?to=code + &n=xưng hô + tên (có dấu, mã hóa URL).
 * @returns {number} số link đã thêm
 */
function fillMissingLinks_(guests) {
  var cols = guestCols_(guests);
  if (linkFormulaWorks_(guests, cols)) return 0;
  var domain = String(getSheet_(SHEETS.config).getRange(1, 2).getDisplayValue()).trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(domain) || /TODO/i.test(domain)) return 0; // chưa có tên miền thật → không ghi link sai
  var last = guests.getLastRow();
  if (last < 2) return 0;
  var n = last - 1;
  var codes = guests.getRange(2, cols.code, n, 1).getValues();
  var names = guests.getRange(2, cols.name, n, 1).getValues();
  var xungHo = guests.getRange(2, cols.xungHo, n, 1).getValues();
  var links = guests.getRange(2, cols.link, n, 1).getValues();
  var added = 0;
  for (var i = 0; i < n; i++) {
    var code = String(codes[i][0] == null ? '' : codes[i][0]).trim();
    var current = String(links[i][0] == null ? '' : links[i][0]).trim();
    if (!code || current) continue; // chưa có code, hoặc ô link đã có chữ → không đụng
    var who = (String(xungHo[i][0] || '') + ' ' + String(names[i][0] || '')).replace(/\s+/g, ' ').trim();
    guests.getRange(i + 2, cols.link).setValue(domain + '/?to=' + code + '&n=' + encodeURIComponent(who));
    added++;
  }
  return added;
}

/** Menu: sinh code + link mời cho khách còn thiếu (chỉ ghi vào ô trống). */
function addMissingInviteLinks() {
  var guests = getSheet_(SHEETS.guests);
  fillMissingCodes();
  var added = fillMissingLinks_(guests);
  var msg = linkFormulaWorks_(guests, guestCols_(guests))
    ? 'Cột link đang tự ghép link cho mọi khách có code — không cần thêm gì.'
    : 'Đã thêm link mời cho ' + added + ' khách còn trống ô link (các ô đã có chữ giữ nguyên).';
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (uiErr) {
    Logger.log(msg);
  }
}

/** Thêm các dòng giờ sự kiện / mừng cưới vào CauHinh nếu chưa có (không ghi đè giá trị đã điền). */
function setupSettingRows_(cfg) {
  var last = cfg.getLastRow();
  var keys = {};
  if (last >= 1) cfg.getRange(1, 3, last, 1).getValues().forEach(function (r) { if (r[0]) keys[String(r[0]).trim()] = true; });
  // Theo nhóm (dòng tiêu đề + các dòng khóa): chỉ thêm dòng còn thiếu; cả nhóm mới thì thêm cả tiêu đề
  var groups = [];
  SETTING_ROWS.forEach(function (r) {
    if (!r[2]) groups.push({ title: r, items: [] });
    else if (groups.length) groups[groups.length - 1].items.push(r);
  });
  var rows = [];
  groups.forEach(function (g) {
    var missing = g.items.filter(function (r) { return !keys[r[2]]; });
    if (!missing.length) return;
    if (missing.length === g.items.length) rows.push(g.title);
    rows.push.apply(rows, missing);
  });
  if (!rows.length) return;
  var start = last + 2;
  cfg.getRange(start, 1, rows.length, 3).setNumberFormat('@').setValues(rows.map(function (r) {
    return [r[0], r[1] === null ? '' : r[1], r[2] === null ? '' : r[2]];
  }));
  var bankRule = SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(BANKS), true).setAllowInvalid(true).build();
  rows.forEach(function (r, i) {
    var row = start + i;
    if (!r[2]) cfg.getRange(row, 1, 1, 2).setFontWeight('bold').setBackground('#e8f0ea');
    else if (/:bank$/.test(r[2])) cfg.getRange(row, 2).setDataValidation(bankRule);
    else if (/^text:/.test(r[2])) cfg.getRange(row, 2).setWrap(true);
  });
  cfg.getRange(1, 3).setNote('Cột C là khóa để thiệp đọc cấu hình — đừng sửa. Chỉ sửa cột B.');
  cfg.setColumnWidth(3, 200);
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Đuôi ngẫu nhiên cho mã khách (bỏ ký tự dễ nhầm: 0 o 1 l i). */
function randomSuffix_(n) {
  var chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  var out = '';
  for (var i = 0; i < n; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

/**
 * Sinh code cho mọi khách chưa có code, dạng "bac-hung-7k2" (xưng hô + tên + 3 ký tự ngẫu nhiên),
 * đảm bảo không trùng. Đuôi ngẫu nhiên giúp người khác khó đoán mã để xem tên khách.
 */
function fillMissingCodes() {
  var sheet = getSheet_(SHEETS.guests);
  var last = sheet.getLastRow();
  if (last < 2) return;
  var cols = guestCols_(sheet);
  var codes = sheet.getRange(2, cols.code, last - 1, 1).getValues();
  var names = sheet.getRange(2, cols.name, last - 1, 1).getValues();
  var xungHo = sheet.getRange(2, cols.xungHo, last - 1, 1).getValues();
  var used = {};
  codes.forEach(function (r) { if (r[0]) used[String(r[0]).toLowerCase()] = true; });
  codes.forEach(function (r, i) {
    var name = names[i][0], xh = xungHo[i][0];
    if (r[0] || !name) return;
    var base = (generateSlug((xh ? xh + ' ' : '') + name) || 'khach').slice(0, 50);
    var code = base + '-' + randomSuffix_(3);
    while (used[code]) code = base + '-' + randomSuffix_(3);
    used[code] = true;
    sheet.getRange(i + 2, cols.code).setValue(code);
  });
}

/**
 * Menu: THÊM hai cột ô tick vào đầu sheet KhachMoi (cột nào đã có thì bỏ qua):
 *  - "Đã mời": tick khi đã gửi thiệp → chữ cả dòng xám nhạt;
 *  - "Mời offline": tick = mời trực tiếp / thiệp giấy, để trống = mời online qua link → nền dòng xanh xám nhạt.
 * Chỉ thêm: cột mới chèn vào (các cột khác dịch sang phải, dữ liệu giữ nguyên), ô tick đặt vào cột mới trống,
 * cộng các quy tắc định dạng có điều kiện. Không sửa / xóa ô nào đã có.
 */
function addTickColumns() {
  var ui = SpreadsheetApp.getUi();
  var guests = getSheet_(SHEETS.guests);
  var cols = guestCols_(guests);
  var missing = [];
  if (!cols.invited) missing.push('"' + INVITED_HEADER + '"');
  if (!cols.offline) missing.push('"' + OFFLINE_HEADER + '"');
  if (missing.length) {
    var ok = ui.alert(
      'Thêm cột ô tick ' + missing.join(' và '),
      'Cột ô tick mới được chèn vào đầu sheet KhachMoi; các cột khác dịch sang phải, dữ liệu giữ nguyên.\n\n' +
      'CHỈ làm bước này SAU KHI đã triển khai phiên bản mới của Apps Script (Triển khai → Quản lý triển khai → ' +
      'bút chì → Phiên bản: Mới → Triển khai). Nếu chưa, thiệp sẽ không tra được tên khách cho tới khi triển khai.\n\n' +
      'Tiếp tục?',
      ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) return;
    if (!cols.invited) {
      var at = cols.offline || 1; // đứng trước cột "Mời offline" nếu đã có, không thì đầu sheet
      guests.insertColumnBefore(at);
      newTickColumn_(guests, at, INVITED_HEADER, 'Tick khi đã gửi thiệp cho khách này — chữ cả dòng sẽ mờ đi.');
      cols = guestCols_(guests);
    }
    if (!cols.offline) {
      guests.insertColumnAfter(cols.invited);
      newTickColumn_(guests, cols.invited + 1, OFFLINE_HEADER,
        'Tick = mời offline (trực tiếp / thiệp giấy) — nền dòng chuyển xanh xám nhạt. Để trống = mời online qua link.');
      cols = guestCols_(guests);
    }
  }
  applyTickRules_(guests, cols);
  ui.alert('"' + INVITED_HEADER + '" ở cột ' + colLetter_(cols.invited) + ', "' + OFFLINE_HEADER + '" ở cột ' +
    colLetter_(cols.offline) + '.\n\nTick "' + INVITED_HEADER + '": chữ cả dòng mờ đi.\nTick "' + OFFLINE_HEADER +
    '": nền dòng xanh xám nhạt (để trống = mời online qua link).');
}

/** Tên cũ của menu (Sheet đang mở từ trước khi cập nhật script vẫn gọi tên này). */
function addInvitedColumn() {
  addTickColumns();
}

/** Cột vừa chèn (còn trống hoàn toàn): tiêu đề + ô tick chưa tick cho mọi dòng. */
function newTickColumn_(guests, col, header, note) {
  guests.getRange(1, col).setValue(header).setFontWeight('bold').setHorizontalAlignment('center').setNote(note);
  guests.setColumnWidth(col, 80);
  guests.getRange(2, col, guests.getMaxRows() - 1, 1).insertCheckboxes().setHorizontalAlignment('center');
}

/**
 * Quy tắc định dạng có điều kiện cho hai cột ô tick. Google Sheets chỉ áp quy tắc ĐẦU TIÊN khớp với một ô,
 * nên dòng vừa "Đã mời" vừa "Mời offline" có quy tắc riêng đứng trước (chữ mờ + nền nhạt).
 * Công thức không dùng dấu phẩy/chấm phẩy nên chạy được với Sheet tiếng Việt lẫn tiếng Anh.
 * Chỉ thay các quy tắc do script này tạo; quy tắc bạn tự thêm giữ nguyên (đứng sau).
 */
function applyTickRules_(guests, cols) {
  var n = guests.getMaxRows() - 1;
  if (n < 1 || (!cols.invited && !cols.offline)) return;
  var range = guests.getRange(2, 1, n, Math.max(guests.getLastColumn(), cols.width));
  var ours = /^=(\$[A-Z]+2|\(\$[A-Z]+2\+\$[A-Z]+2\)=2)$/;
  var others = guests.getConditionalFormatRules().filter(function (rule) {
    var c = rule.getBooleanCondition();
    var v = c && c.getCriteriaValues();
    return !(v && v.length === 1 && ours.test(String(v[0])));
  });
  var make = function (formula, font, fill) {
    var b = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setRanges([range]);
    if (font) b = b.setFontColor(font);
    if (fill) b = b.setBackground(fill);
    return b.build();
  };
  var I = cols.invited ? '$' + colLetter_(cols.invited) + '2' : '';
  var O = cols.offline ? '$' + colLetter_(cols.offline) + '2' : '';
  var mine = [];
  if (I && O) mine.push(make('=(' + I + '+' + O + ')=2', FADED_TEXT, OFFLINE_FILL));
  if (I) mine.push(make('=' + I, FADED_TEXT, null));
  if (O) mine.push(make('=' + O, null, OFFLINE_FILL));
  guests.setConditionalFormatRules(mine.concat(others));
}

/**
 * Sheet KhachMoi (trigger đơn giản), CHỈ THÊM vào ô trống:
 *  - nhập/dán tên hoặc xưng hô (kể cả dán nhiều cột / cả dòng) → sinh code cho dòng chưa có code;
 *  - công thức cột link không chạy được → ghi link mời vào ô link còn trống của dòng đã có code.
 * Không bao giờ sửa hay xóa ô đã có chữ.
 */
function onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    // Sửa CauHinh / LoiChuc: thiệp thấy thay đổi ngay, không phải chờ cache 60 giây
    if (sheet.getName() === SHEETS.config) CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY);
    if (sheet.getName() === SHEETS.wishes) CacheService.getScriptCache().remove(WISHES_CACHE_KEY);
    if (sheet.getName() !== SHEETS.guests || e.range.getLastRow() < 2) return;
    var cols = guestCols_(sheet);
    var a = e.range.getColumn(), b = e.range.getLastColumn();
    var touches = function (c) { return a <= c && c <= b; };
    if (touches(cols.name) || touches(cols.xungHo)) fillMissingCodes();
    var added = fillMissingLinks_(sheet);
    if (added) e.source.toast('Đã thêm link mời cho ' + added + ' khách.', '💌 Link mời', 5);
  } catch (err) {
    Logger.log('onEdit lỗi: ' + err); // xem ở Apps Script → Lần thực thi
  }
}

function onOpen() {
  // Không có mục nào sửa / xóa dữ liệu đã có (dữ liệu khách và lời chúc là thật).
  SpreadsheetApp.getUi()
    .createMenu('💌 Thiệp cưới')
    .addItem('Sinh code + link mời cho khách còn trống', 'addMissingInviteLinks')
    .addItem('Thêm cột ô tick "Đã mời" / "Mời offline"', 'addTickColumns')
    .addSeparator()
    .addItem('Tạo sheet còn thiếu (không sửa sheet đã có)', 'setupDatabase')
    .addToUi();
}
