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
 *   GET  ?action=settings        → {success:true, data:{events:{<id>:{time}}, accounts:[{family,bankBin,bankName,accountNo,accountName,qrImage}]}}
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

/** Lời chúc mẫu (tên giả, mã "mau") để sổ lưu bút không trống khi mới gửi thiệp. Xóa / bỏ tick "Hiện" khi đã có lời chúc thật. */
var SAMPLE_WISHES = [
  ['Minh Anh', 'Bạn đại học của Nhi', 'Trăm năm một chữ đồng lòng, chúc hai bạn mãi thuận dòng yêu thương. Dù mưa nắng, dẫu gió sương, tay trong tay bước con đường bình yên.'],
  ['Hoàng Long', 'Đồng nghiệp của Trung', 'Cuối năm trời đất se duyên, Trung – Nhi về một mái hiên chung nhà. Chúc cho hạnh phúc đậm đà, sớm hôm vui vẻ, cửa nhà ấm êm.'],
  ['Thu Trang', 'Bạn thân của Nhi', 'Từ nay hai đứa thành đôi, chung mâm cơm tối, chung lời ước mơ. Chúc cho tình mãi như thơ, bạc đầu vẫn nhớ ngày chờ ngày mong.'],
  ['Đức Huy', 'Bạn cấp 3 của Trung', 'Chúc hai bạn giữ mãi ánh mắt của ngày hôm nay — ánh mắt nhìn nhau như thể cả thế giới chỉ còn hai người. Trăm năm hạnh phúc nhé!'],
  ['Ngọc Ánh', 'Đồng nghiệp của Nhi', 'Hoa cau thơm ngát hiên nhà, trầu cau đã ngỏ, mẹ cha vui mừng. Chúc anh chị trăm năm hòa hợp, sớm đón tin vui!'],
  ['Quang Vinh', 'Đồng nghiệp của Trung', 'Gió đưa duyên thắm về đây, hai bờ thương nhớ nay xây một nhà. Chúc cho tình mãi mặn mà, như trăng mười sáu, như hoa đầu mùa.'],
  ['Phương Thảo', 'Bạn đại học của Nhi', 'Lào Cai đến với Hải Phòng, núi xanh tìm biển, đúng lòng mong nhau. Chúc cho nghĩa nặng tình sâu, trăm năm vẫn giữ trước sau một lòng.'],
  ['Tuấn Anh', 'Bạn đại học của Trung', 'Ngày vui pháo đỏ rợp đường, cô dâu e ấp, chàng thương ngập lòng. Chúc hai bạn thuận vợ chồng, biển Đông cũng cạn, mặn nồng sớm hôm.'],
  ['Hải Yến', 'Đồng nghiệp của Nhi', 'Có những người đi cùng nhau một đoạn, và có những người chọn đi cùng nhau cả đời. Mừng vì hai bạn đã tìm thấy nhau — chúc mái nhà nhỏ luôn đầy tiếng cười.'],
  ['Văn Nam', 'Bạn của Trung', 'Mùa đông mà ấm như xuân, bởi vì có một người thân bên mình. Chúc hai bạn trọn chữ tình, sớm mai thức dậy, bình minh có nhau.'],
  ['Khánh Linh', 'Bạn thân của Nhi', 'Chúc hai bạn: giận thì nói, thương thì ôm, mệt thì tựa vào nhau. Hôn nhân không cần hoàn hảo, chỉ cần hai người luôn chọn nhau mỗi ngày.'],
  ['Thanh Tùng', 'Đồng nghiệp của Trung', 'Ngõ quê rộn tiếng cười vui, đón cô dâu mới, ngọt bùi chia nhau. Chúc cho son sắt trước sau, đầu xanh đến lúc bạc màu vẫn thương.'],
  ['Bảo Ngọc', 'Bạn cấp 3 của Nhi', 'Chúc tình yêu của hai bạn như bếp lửa ngày đông: không cần rực rỡ, chỉ cần ấm áp và bền lâu. Trăm năm hạnh phúc!'],
  ['Mạnh Cường', 'Bạn đại học của Trung', 'Đôi chim về đậu chung cành, đôi tim chung một nhịp lành yêu thương. Chúc hai bạn vững con đường, trăm năm như thuở mới vương tơ hồng.'],
];

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
  var data = { events: events, accounts: accounts };
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
  var col = headerIndex_(GUEST_HEADERS);
  appendRowSafe_(getSheet_(SHEETS.opens), [new Date(), code, safeCell_(String(found.values[col.name] || ''))]);
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

function headerIndex_(headers) {
  var idx = {};
  headers.forEach(function (h, i) { idx[h] = i; });
  return idx;
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
  setupCore_();
  var msg = 'Đã tạo xong các sheet. Nhớ điền tên miền vào CauHinh!B1 rồi triển khai Web App.';
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

/** Tạo các sheet, tiêu đề, công thức link (chạy lại không mất dữ liệu). */
function setupCore_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var cfg = ensureSheet_(ss, SHEETS.config, ['Tên miền thiệp (không có / ở cuối)', 'https://TODO.pages.dev']);
  cfg.setColumnWidth(1, 280);
  cfg.setColumnWidth(2, 420);
  // Link theo nhà: gửi chung cho bạn bè / đồng nghiệp của mỗi bên (không cần mã khách)
  cfg.getRange(3, 1, 2, 1).setValues([['Link thiệp nhà trai'], ['Link thiệp nhà gái']]);
  cfg.getRange(3, 2).setFormula('=B1 & "/?ben=nha-trai"');
  cfg.getRange(4, 2).setFormula('=B1 & "/?ben=nha-gai"');
  setupSettingRows_(cfg);

  var guestsIsNew = !ss.getSheetByName(SHEETS.guests);
  var guests = ensureSheet_(ss, SHEETS.guests, GUEST_HEADERS);
  // Cột link tự ghép tên miền + ?to= + code cho mọi dòng
  var linkCol = GUEST_HEADERS.indexOf('link') + 1;
  // Link mời = tên miền + ?to=mã + &n=tên có dấu (để thiệp hiện đúng tên ngay cả khi chưa tra được Sheet)
  setLocaleFormula_(
    guests.getRange(1, linkCol),
    '={"link"; ARRAYFORMULA(IF(A2:A="", "", ' + SHEETS.config + '!$B$1 & "/?to=" & A2:A & "&n=" & ENCODEURL(TRIM(C2:C & " " & B2:B))))}'
  );
  var sideRule = SpreadsheetApp.newDataValidation().requireValueInList(['nha-trai', 'nha-gai', 'ban-chung'], true).setAllowInvalid(true).build();
  guests.getRange(2, GUEST_HEADERS.indexOf('side') + 1, guests.getMaxRows() - 1, 1).setDataValidation(sideRule);
  guests.getRange(1, 1).setNote('Để trống code: tự sinh khi bạn nhập tên, dạng xưng-hô-tên + 3 ký tự ngẫu nhiên (vd bac-hung-7k2) để khó đoán.');
  guests.getRange(1, GUEST_HEADERS.indexOf('groups') + 1).setNote('Các nhóm cách nhau dấu phẩy, vd: gia-dinh, ban-be. Khớp với audience trong wedding.config.js');

  ensureSheet_(ss, SHEETS.rsvp, RSVP_HEADERS);
  var wishes = ensureSheet_(ss, SHEETS.wishes, WISH_HEADERS);
  // Checkbox "Hiện" được thêm khi ghi lời chúc; xóa checkbox trống bên dưới (bản cũ tạo sẵn cả cột).
  // Không insertCheckboxes() ở dòng cũ: hàm đó đặt mọi ô về FALSE → ẩn hết lời chúc
  var firstEmpty = nextEmptyRow_(wishes);
  if (wishes.getMaxRows() >= firstEmpty) {
    wishes.getRange(firstEmpty, WISH_HEADERS.length, wishes.getMaxRows() - firstEmpty + 1, 1).removeCheckboxes();
  }
  wishes.getRange(1, WISH_HEADERS.length).setNote('Bỏ tick để ẩn lời chúc khỏi thiệp (cập nhật sau tối đa 60 giây).');
  ensureSheet_(ss, SHEETS.opens, OPEN_HEADERS);

  // Khách mẫu để thử link mời — chỉ khi vừa tạo sheet (xóa rồi thì không thêm lại)
  if (guestsIsNew) {
    guests.getRange(2, 1, 2, 7).setValues([
      ['bac-hung-7k2', 'Hùng', 'Bác', 'nha-trai', 'gia-dinh', '', 'Khách mẫu — xóa khi dùng thật'],
      ['ban-lan-3x9', 'Lan', 'Bạn', 'nha-gai', 'ban-be', '', 'Khách mẫu — xóa khi dùng thật'],
    ]);
  }
}

/** Thêm các dòng giờ sự kiện / mừng cưới vào CauHinh nếu chưa có (không ghi đè giá trị đã điền). */
function setupSettingRows_(cfg) {
  var last = cfg.getLastRow();
  var keys = {};
  if (last >= 1) cfg.getRange(1, 3, last, 1).getValues().forEach(function (r) { if (r[0]) keys[String(r[0]).trim()] = true; });
  var fresh = !SETTING_ROWS.some(function (r) { return r[2] && keys[r[2]]; });
  var rows = SETTING_ROWS.filter(function (r) { return r[2] ? !keys[r[2]] : fresh; });
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
  });
  cfg.getRange(1, 3).setNote('Cột C là khóa để thiệp đọc cấu hình — đừng sửa. Chỉ sửa cột B.');
  cfg.setColumnWidth(3, 200);
}

/**
 * Thêm lời chúc mẫu (mã "mau"). Đã có rồi thì chỉ cập nhật nội dung lời chúc theo SAMPLE_WISHES
 * (giữ nguyên tên người chúc và "bạn là" mà bạn đã sửa trong Sheet).
 */
function seedSampleWishes() {
  var sheet = getSheet_(SHEETS.wishes);
  var last = sheet.getLastRow();
  if (last >= 2) {
    var rows = sheet.getRange(2, 1, last - 1, WISH_HEADERS.length).getValues();
    var mau = [];
    rows.forEach(function (r, i) { if (r[1] === 'mau') mau.push({ row: i + 2, at: r[0] }); });
    if (mau.length) {
      // cũ nhất trước = thứ tự lúc thêm
      mau.sort(function (a, b) { return new Date(a.at).getTime() - new Date(b.at).getTime(); });
      mau.forEach(function (m, i) {
        if (SAMPLE_WISHES[i]) sheet.getRange(m.row, WISH_HEADERS.indexOf('text') + 1).setValue(SAMPLE_WISHES[i][2]);
      });
      CacheService.getScriptCache().remove(WISHES_CACHE_KEY);
      Logger.log('Đã cập nhật nội dung ' + Math.min(mau.length, SAMPLE_WISHES.length) + ' lời chúc mẫu.');
      return;
    }
  }
  var now = Date.now();
  var n = SAMPLE_WISHES.length;
  SAMPLE_WISHES.forEach(function (w, i) {
    // rải thời gian trong ~10 ngày gần đây, cũ nhất trước
    var at = new Date(now - (n - i) * 17 * 3600 * 1000 - Math.floor(Math.random() * 3600 * 1000));
    var row = appendRowSafe_(sheet, [at, 'mau', w[0], w[1], w[2], true]);
    var cell = sheet.getRange(row, WISH_HEADERS.length);
    cell.insertCheckboxes();
    cell.check();
  });
  CacheService.getScriptCache().remove(WISHES_CACHE_KEY);
  Logger.log('Đã thêm ' + n + ' lời chúc mẫu.');
}

/** Xóa 2 khách mẫu bac-hung-7k2 / ban-lan-3x9 khỏi KhachMoi. */
function removeSampleGuests() {
  var sheet = getSheet_(SHEETS.guests);
  var last = sheet.getLastRow();
  if (last < 2) return;
  var codes = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = codes.length - 1; i >= 0; i--) {
    if (codes[i][0] === 'bac-hung-7k2' || codes[i][0] === 'ban-lan-3x9') sheet.deleteRow(i + 2);
  }
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
  var range = sheet.getRange(2, 1, last - 1, 3);
  var rows = range.getValues();
  var used = {};
  rows.forEach(function (r) { if (r[0]) used[String(r[0]).toLowerCase()] = true; });
  rows.forEach(function (r, i) {
    if (r[0] || !r[1]) return;
    var base = (generateSlug((r[2] ? r[2] + ' ' : '') + r[1]) || 'khach').slice(0, 50);
    var code = base + '-' + randomSuffix_(3);
    while (used[code]) code = base + '-' + randomSuffix_(3);
    used[code] = true;
    sheet.getRange(i + 2, 1).setValue(code);
  });
}

/** Tự sinh code khi nhập tên/xưng hô vào sheet KhachMoi (trigger đơn giản). */
function onEdit(e) {
  try {
    var sheet = e.range.getSheet();
    // Sửa CauHinh / LoiChuc: thiệp thấy thay đổi ngay, không phải chờ cache 60 giây
    if (sheet.getName() === SHEETS.config) CacheService.getScriptCache().remove(SETTINGS_CACHE_KEY);
    if (sheet.getName() === SHEETS.wishes) CacheService.getScriptCache().remove(WISHES_CACHE_KEY);
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
    .addSeparator()
    .addItem('Thêm / cập nhật lời chúc mẫu', 'seedSampleWishes')
    .addItem('Xóa 2 khách mẫu (bac-hung, ban-lan)', 'removeSampleGuests')
    .addToUi();
}
