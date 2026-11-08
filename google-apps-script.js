/**
 * ==============================================================================
 * HỆ THỐNG DATABASE GOOGLE SHEET & GOOGLE DOC - THIỆP CƯỚI SONG HỶ XANH
 * ==============================================================================
 * Hướng dẫn cài đặt nhanh (2 phút):
 * 1. Mở Google Drive -> Tạo 1 "Google Trang tính" (Google Sheets) mới.
 * 2. Đặt tên trang tính: "Thiệp Cưới Duy Phương & Thùy Dương - CSDL".
 * 3. Trên menu Google Trang tính, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 4. Xóa toàn bộ mã mặc định và DÁN TOÀN BỘ NỘI DUNG TỆP NÀY VÀO.
 * 5. (Tùy chọn nếu muốn lưu thêm vào Google Doc):
 *    - Tạo 1 file Google Docs (Tài liệu).
 *    - Copy ID của file Google Doc (chuỗi ký tự trên thanh URL giữa /d/ và /edit)
 *    - Dán vào biến GOOGLE_DOC_ID ở phần CẤU HÌNH bên dưới.
 * 6. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web App).
 *    - Mô tả: "Cơ sở dữ liệu thiệp cưới v1".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
 *    - Người có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG!
 * 7. Nhấn "Triển khai" -> Cấp quyền truy cập cho tài khoản Google của bạn khi được hỏi.
 * 8. Copy "URL ứng dụng web" (có dạng: https://script.google.com/macros/s/.../exec).
 * 9. Dán URL này vào mục "Cấu hình Google Doc" trong trang Admin của website thiệp cưới!
 * ==============================================================================
 */

const CONFIG = {
  // (Tùy chọn) ID của Google Doc nếu muốn đồng bộ trực tiếp ra 1 file Google Doc văn bản.
  // Ví dụ: https://docs.google.com/document/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit -> ID là "1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
  // Nếu để trống, hệ thống sẽ lưu đầy đủ trên Google Sheets (Trang tính).
  GOOGLE_DOC_ID: "",

  // Tên các bảng tính (Sheets) làm Database
  SHEET_GUESTS: "KhachMoi",          // Danh sách khách & link thiệp riêng
  SHEET_RSVP: "XacNhanThamDu",       // Lịch sử xác nhận tham dự
  SHEET_WISHES: "LoiChuc",           // Lời chúc từ sổ lưu bút
  SHEET_GIFTS: "MungCuoi",           // Ghi nhận mừng cưới & quà tặng
  SHEET_LIKES: "ThongKeVaTim"        // Thống kê & Lượt thả tim
};

/**
 * Xử lý yêu cầu GET từ Website hoặc Admin
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'ping';

    if (action === 'ping') {
      return jsonResponse({
        success: true,
        message: 'Kết nối Google Sheet & Google Doc Database thành công! 💍',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'setup' || action === 'setupDatabase') {
      const result = setupDatabase();
      return jsonResponse({
        success: true,
        message: 'Khởi tạo cấu trúc Database trên Google Sheet & Doc thành công!',
        data: result
      });
    }

    // Lấy toàn bộ dữ liệu đồng bộ hai chiều (Full 2-Way Sync)
    if (action === 'getAllData' || action === 'getFullSync') {
      const allData = getAllDatabaseData();
      return jsonResponse({
        success: true,
        message: 'Lấy toàn bộ dữ liệu từ Google Sheet thành công!',
        data: allData
      });
    }

    if (action === 'getGuests') {
      const guests = getAllGuests();
      return jsonResponse({
        success: true,
        total: guests.length,
        data: guests
      });
    }

    if (action === 'getWishes') {
      const wishes = getAllWishes();
      return jsonResponse({
        success: true,
        total: wishes.length,
        data: wishes
      });
    }

    if (action === 'getGifts') {
      const gifts = getAllGifts();
      return jsonResponse({
        success: true,
        total: gifts.length,
        data: gifts
      });
    }

    if (action === 'getLikes') {
      const likes = getLikes();
      return jsonResponse({
        success: true,
        data: likes
      });
    }

    if (action === 'getStats') {
      const stats = calculateStats();
      return jsonResponse({
        success: true,
        data: stats
      });
    }

    return jsonResponse({
      success: false,
      message: 'Hành động không xác định (Unknown action): ' + action
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Xử lý yêu cầu POST từ Website hoặc Admin
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action;

    // 1. Thêm hoặc cập nhật Khách mời & Link thiệp riêng
    if (action === 'addGuest' || action === 'updateGuest') {
      const result = saveOrUpdateGuest(payload.data || payload);
      return jsonResponse({
        success: true,
        message: 'Đã lưu khách mời và link thiệp riêng vào Google Doc/Sheet!',
        data: result
      });
    }

    // Xóa khách mời khỏi Google Sheet (Khi xóa trên website)
    if (action === 'deleteGuest') {
      const result = deleteGuest(payload.data || payload);
      return jsonResponse({
        success: true,
        message: result.deleted ? 'Đã xóa khách mời khỏi Google Sheet!' : 'Không tìm thấy khách mời trên Google Sheet để xóa',
        data: result
      });
    }

    // 2. Xác nhận tham dự (RSVP)
    if (action === 'rsvp' || action === 'confirmAttendance') {
      const result = recordRsvp(payload.data || payload);
      return jsonResponse({
        success: true,
        message: 'Đã ghi nhận xác nhận tham dự vào Google Doc/Sheet!',
        data: result
      });
    }

    // 3. Lưu lời chúc
    if (action === 'addWish') {
      const result = recordWish(payload.data || payload);
      return jsonResponse({
        success: true,
        message: 'Đã lưu lời chúc vào Google Sheet!',
        data: result
      });
    }

    // Xóa lời chúc khỏi Google Sheet (Khi xóa trên website)
    if (action === 'deleteWish') {
      const result = deleteWish(payload.data || payload);
      return jsonResponse({
        success: true,
        message: result.deleted ? 'Đã xóa lời chúc khỏi Google Sheet!' : 'Không tìm thấy lời chúc trên Google Sheet để xóa',
        data: result
      });
    }

    // 4. Lưu mừng cưới
    if (action === 'addGift') {
      const result = recordGift(payload.data || payload);
      return jsonResponse({
        success: true,
        message: 'Đã lưu bản ghi mừng cưới vào Google Sheet!',
        data: result
      });
    }

    // Xóa mừng cưới khỏi Google Sheet (Khi xóa trên website)
    if (action === 'deleteGift') {
      const result = deleteGift(payload.data || payload);
      return jsonResponse({
        success: true,
        message: result.deleted ? 'Đã xóa bản ghi mừng cưới khỏi Google Sheet!' : 'Không tìm thấy bản ghi mừng cưới trên Sheet để xóa',
        data: result
      });
    }

    // 5. Lưu & đồng bộ lượt thả tim (Likes)
    if (action === 'addLike' || action === 'updateLikes') {
      const result = recordLike(payload.data || payload);
      return jsonResponse({
        success: true,
        message: 'Đã đồng bộ lượt thả tim vào Google Sheet!',
        data: result
      });
    }

    // 6. Đồng bộ hàng loạt từ Website lên Google Sheet/Doc (Batch Sync)
    if (action === 'batchSync') {
      const result = handleBatchSync(payload);
      return jsonResponse({
        success: true,
        message: 'Đã đồng bộ toàn bộ dữ liệu lên Google Doc/Sheet thành công!',
        data: result
      });
    }

    return jsonResponse({
      success: false,
      message: 'Hành động POST không hợp lệ: ' + action
    });

  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Tạo phản hồi JSON chuẩn cho Apps Script
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper: Lấy Spreadsheet hiện tại
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    throw new Error('Script này cần được gắn vào một Google Spreadsheet (Extensions -> Apps Script).');
  }
}

/**
 * Khởi tạo cấu trúc các Sheet và định dạng đẹp mắt
 */
function setupDatabase() {
  const ss = getSpreadsheet();

  // 1. Sheet Khách Mời
  let sheetGuests = ss.getSheetByName(CONFIG.SHEET_GUESTS);
  if (!sheetGuests) {
    sheetGuests = ss.insertSheet(CONFIG.SHEET_GUESTS);
  }
  const headersGuests = [
    "STT",
    "Mã Khách (Slug)",
    "Họ và Tên Khách Mời",
    "Phía Khách",
    "Số Điện Thoại",
    "Mối Quan Hệ",
    "Link Thiệp Riêng",
    "Trạng Thái RSVP",
    "Số Người Tham Dự",
    "Ghi Chú",
    "Thời Gian Tạo/Cập Nhật"
  ];
  setupSheetHeader(sheetGuests, headersGuests, "#19381C");

  // 2. Sheet Xác Nhận Tham Dự (RSVP)
  let sheetRsvp = ss.getSheetByName(CONFIG.SHEET_RSVP);
  if (!sheetRsvp) {
    sheetRsvp = ss.insertSheet(CONFIG.SHEET_RSVP);
  }
  const headersRsvp = [
    "Thời Gian Xác Nhận",
    "Mã Khách Mời",
    "Họ và Tên",
    "Phía Khách",
    "Xác Nhận Tham Dự",
    "Số Lượng Khách",
    "Lời Nhắn / Ghi Chú Kèm Theo"
  ];
  setupSheetHeader(sheetRsvp, headersRsvp, "#2A522D");

  // 3. Sheet Sổ Lưu Bút / Lời Chúc
  let sheetWishes = ss.getSheetByName(CONFIG.SHEET_WISHES);
  if (!sheetWishes) {
    sheetWishes = ss.insertSheet(CONFIG.SHEET_WISHES);
  }
  const headersWishes = [
    "Thời Gian Gửi",
    "Người Gửi Lời Chúc",
    "Mối Quan Hệ",
    "Nội Dung Lời Chúc"
  ];
  setupSheetHeader(sheetWishes, headersWishes, "#19381C");

  // 4. Sheet Mừng Cưới & Quà Tặng
  let sheetGifts = ss.getSheetByName(CONFIG.SHEET_GIFTS);
  if (!sheetGifts) {
    sheetGifts = ss.insertSheet(CONFIG.SHEET_GIFTS);
  }
  const headersGifts = [
    "Thời Gian",
    "Người Gửi Mừng",
    "Số Tiền (VNĐ)",
    "Gửi Mừng Cho Ai",
    "Hình Thức",
    "Lời Nhắn Kèm Theo",
    "Mã ID (Hệ Thống)"
  ];
  setupSheetHeader(sheetGifts, headersGifts, "#C5A059");

  // 5. Sheet Thống Kê & Lượt Thả Tim
  let sheetLikes = ss.getSheetByName(CONFIG.SHEET_LIKES);
  if (!sheetLikes) {
    sheetLikes = ss.insertSheet(CONFIG.SHEET_LIKES);
  }
  const headersLikes = [
    "Thời Gian Cập Nhật",
    "Tổng Số Lượt Tim",
    "Lần Bấm / Tăng",
    "Ghi Chú Nguồn"
  ];
  setupSheetHeader(sheetLikes, headersLikes, "#E91E63");

  // (Tùy chọn) Khởi tạo Google Doc nếu có ID
  if (CONFIG.GOOGLE_DOC_ID) {
    setupGoogleDocSummary();
  }

  return {
    sheets: [CONFIG.SHEET_GUESTS, CONFIG.SHEET_RSVP, CONFIG.SHEET_WISHES, CONFIG.SHEET_GIFTS, CONFIG.SHEET_LIKES],
    googleDocConfigured: Boolean(CONFIG.GOOGLE_DOC_ID)
  };
}

/**
 * Định dạng hàng tiêu đề của Sheet
 */
function setupSheetHeader(sheet, headers, bgHex) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setBackground(bgHex);
  range.setFontColor("#FFFFFF");
  range.setFontWeight("bold");
  range.setFontFamily("Roboto");
  range.setFontSize(10);
  range.setHorizontalAlignment("center");
  range.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
}

/**
 * Thêm hoặc cập nhật khách mời
 */
function saveOrUpdateGuest(guest) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_GUESTS);
  const data = sheet.getDataRange().getValues();

  const code = (guest.code || '').trim().toLowerCase();
  const name = (guest.name || '').trim();
  const side = guest.side || 'Nhà Trai';
  const phone = guest.phone || '';
  const relation = guest.relation || 'Bạn bè';
  const link = guest.link || '';
  const rsvpStatus = guest.rsvpStatus || 'Chưa phản hồi';
  const guestCount = Number(guest.guestCount) || (rsvpStatus === 'attending' || rsvpStatus === 'Sẽ tham dự' ? 1 : 0);
  const notes = guest.notes || '';
  const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  let foundRow = -1;
  // Tìm kiếm theo code (cột B - index 1) hoặc tên (cột C - index 2)
  for (let i = 1; i < data.length; i++) {
    const rowCode = (data[i][1] || '').toString().trim().toLowerCase();
    const rowName = (data[i][2] || '').toString().trim().toLowerCase();
    if ((code && rowCode === code) || (name && rowName === name.toLowerCase())) {
      foundRow = i + 1; // 1-indexed
      break;
    }
  }

  let finalStt = data.length; // Số thứ tự
  if (foundRow > 1) {
    // Cập nhật dòng hiện có
    finalStt = data[foundRow - 1][0];
    const rowValues = [
      finalStt,
      code || data[foundRow - 1][1],
      name,
      side,
      phone,
      relation,
      link || data[foundRow - 1][6],
      rsvpStatus,
      guestCount,
      notes,
      timestamp
    ];
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Thêm dòng mới
    const newRow = [
      finalStt,
      code,
      name,
      side,
      phone,
      relation,
      link,
      rsvpStatus,
      guestCount,
      notes,
      timestamp
    ];
    sheet.appendRow(newRow);
  }

  // Cập nhật vào Google Doc nếu có cấu hình
  if (CONFIG.GOOGLE_DOC_ID) {
    syncGuestToGoogleDoc(guest, link);
  }

  return { name, code, link, rsvpStatus, guestCount };
}

/**
 * Ghi nhận phản hồi xác nhận tham dự (RSVP)
 */
function recordRsvp(rsvp) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheetRsvp = ss.getSheetByName(CONFIG.SHEET_RSVP);
  const sheetGuests = ss.getSheetByName(CONFIG.SHEET_GUESTS);

  const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  const name = (rsvp.name || '').trim();
  const code = (rsvp.guestCode || rsvp.code || '').trim().toLowerCase();
  const side = rsvp.side || 'Nhà Trai';
  const willAttend = rsvp.willAttend === true || rsvp.willAttend === 'yes' || rsvp.willAttend === 'true';
  const statusStr = willAttend ? '✓ Sẽ tham dự' : '✕ Không thể đến';
  const guestCount = willAttend ? (Math.max(1, parseInt(rsvp.guestCount || rsvp.count, 10) || 1)) : 0;
  const notes = rsvp.notes || '';

  // 1. Ghi vào Sheet Lịch sử RSVP
  sheetRsvp.appendRow([
    timestamp,
    code,
    name,
    side,
    statusStr,
    guestCount,
    notes
  ]);

  // 2. Tìm và cập nhật trạng thái trong Sheet Khách Mời
  const guestData = sheetGuests.getDataRange().getValues();
  let matched = false;
  for (let i = 1; i < guestData.length; i++) {
    const rowCode = (guestData[i][1] || '').toString().trim().toLowerCase();
    const rowName = (guestData[i][2] || '').toString().trim().toLowerCase();
    if ((code && rowCode === code) || (rowName === name.toLowerCase())) {
      // Cập nhật Cột H (Trạng thái RSVP), Cột I (Số người), Cột K (Thời gian)
      sheetGuests.getRange(i + 1, 8).setValue(statusStr);
      sheetGuests.getRange(i + 1, 9).setValue(guestCount);
      sheetGuests.getRange(i + 1, 11).setValue(timestamp);
      matched = true;
      break;
    }
  }

  // Nếu khách chưa có trong danh sách nhưng điền form, tự động thêm vào danh sách
  if (!matched && name) {
    const stt = guestData.length;
    sheetGuests.appendRow([
      stt,
      code || 'tu-dien-form',
      name,
      side,
      '',
      'Khách tự xác nhận RSVP',
      '',
      statusStr,
      guestCount,
      notes,
      timestamp
    ]);
  }

  // 3. Ghi log vào Google Doc nếu có cấu hình
  if (CONFIG.GOOGLE_DOC_ID) {
    appendRsvpToGoogleDoc({
      timestamp,
      name,
      side,
      statusStr,
      guestCount,
      notes
    });
  }

  return { name, status: statusStr, guestCount, timestamp };
}

/**
 * Ghi nhận lời chúc vào Sheet
 */
function recordWish(wish) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_WISHES);
  const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  sheet.appendRow([
    timestamp,
    wish.author || wish.sender || 'Ẩn danh',
    wish.relation || 'Khách mời',
    wish.text || wish.message || '',
    wish.id || ''
  ]);

  return { success: true };
}

/**
 * Xóa lời chúc khỏi Google Sheet (khi xóa trên website hoặc quản trị)
 */
function deleteWish(target) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_WISHES);
  if (!sheet) return { deleted: false };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { deleted: false };

  const targetId = (target.id || '').trim();
  const targetAuthor = (target.author || target.sender || '').trim().toLowerCase();
  const targetText = (target.text || target.message || '').trim().toLowerCase();

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const rowAuthor = String(row[1] || '').trim().toLowerCase();
    const rowText = String(row[3] || '').trim().toLowerCase();
    const rowId = String(row[4] || '').trim();

    const matchId = targetId && rowId && rowId === targetId;
    const matchContent = targetAuthor && targetText && rowAuthor === targetAuthor && rowText === targetText;

    if (matchId || matchContent) {
      sheet.deleteRow(i + 1);
      return { deleted: true, row: i + 1 };
    }
  }

  return { deleted: false };
}

/**
 * Lấy toàn bộ danh sách lời chúc từ Sheet
 */
function getAllWishes() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_WISHES);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const wishes = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1] && !row[3]) continue; // Bỏ qua hàng trống
    wishes.push({
      timestamp: row[0],
      author: String(row[1] || ''),
      relation: String(row[2] || ''),
      text: String(row[3] || ''),
      id: String(row[4] || '')
    });
  }
  return wishes;
}

/**
 * Ghi nhận mừng cưới vào Sheet
 */
function recordGift(gift) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_GIFTS);
  const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  sheet.appendRow([
    timestamp,
    gift.senderName || gift.sender || 'Ẩn danh',
    Number(gift.amount) || 0,
    gift.target || 'Cả hai vợ chồng',
    gift.method || 'Chuyển khoản QR',
    gift.message || '',
    gift.id || ''
  ]);

  return { success: true };
}

/**
 * Xóa bản ghi mừng cưới khỏi Sheet
 */
function deleteGift(target) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_GIFTS);
  if (!sheet) return { deleted: false };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { deleted: false };

  const targetId = (target.id || '').trim();
  const targetSender = (target.senderName || target.sender || '').trim().toLowerCase();
  const targetAmount = Number(target.amount) || 0;

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const rowSender = String(row[1] || '').trim().toLowerCase();
    const rowAmount = Number(row[2]) || 0;
    const rowId = String(row[6] || '').trim();

    const matchId = targetId && rowId && rowId === targetId;
    const matchSender = targetSender && rowSender === targetSender && (!targetAmount || rowAmount === targetAmount);

    if (matchId || matchSender) {
      sheet.deleteRow(i + 1);
      return { deleted: true, row: i + 1 };
    }
  }

  return { deleted: false };
}

/**
 * Lấy toàn bộ danh sách mừng cưới từ Sheet
 */
function getAllGifts() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_GIFTS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const gifts = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[1] && !row[2]) continue;
    gifts.push({
      timestamp: row[0],
      senderName: String(row[1] || ''),
      amount: Number(row[2]) || 0,
      target: String(row[3] || 'Cả hai vợ chồng'),
      method: String(row[4] || 'Chuyển khoản QR'),
      message: String(row[5] || ''),
      id: String(row[6] || '')
    });
  }
  return gifts;
}

/**
 * Xóa khách mời khỏi Google Sheet
 */
function deleteGuest(target) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_GUESTS);
  if (!sheet) return { deleted: false };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { deleted: false };

  const targetCode = (target.code || '').trim().toLowerCase();
  const targetName = (target.name || '').trim().toLowerCase();

  for (let i = data.length - 1; i >= 1; i--) {
    const rowCode = String(data[i][1] || '').trim().toLowerCase();
    const rowName = String(data[i][2] || '').trim().toLowerCase();

    if ((targetCode && rowCode === targetCode) || (targetName && rowName === targetName)) {
      sheet.deleteRow(i + 1);
      return { deleted: true, row: i + 1 };
    }
  }

  return { deleted: false };
}

/**
 * Ghi nhận hoặc cập nhật lượt thả tim vào Sheet
 */
function recordLike(likeData) {
  setupDatabase();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_LIKES);
  const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  const totalLikes = Number(likeData.totalLikes || likeData.count) || 88;
  const inc = String(likeData.increment || "+1");

  sheet.appendRow([
    timestamp,
    totalLikes,
    inc,
    "Khách thả tim trên Landing Page"
  ]);

  return { success: true, count: totalLikes, timestamp };
}

/**
 * Lấy số lượng lượt thả tim mới nhất từ Sheet
 */
function getLikes() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_LIKES);
  if (!sheet) return { count: 88 };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { count: 88 };

  // Lấy dòng cuối cùng có dữ liệu số
  for (let i = data.length - 1; i >= 1; i--) {
    const val = Number(data[i][1]);
    if (!isNaN(val) && val > 0) {
      return { count: val, updatedAt: data[i][0] };
    }
  }

  return { count: 88 };
}

/**
 * Lấy lịch sử xác nhận tham dự (RSVP)
 */
function getAllRsvps() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_RSVP);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const rsvps = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[2]) continue;
    rsvps.push({
      timestamp: row[0],
      code: String(row[1] || ''),
      name: String(row[2] || ''),
      side: String(row[3] || 'Nhà Trai'),
      statusStr: String(row[4] || ''),
      guestCount: Number(row[5]) || 0,
      notes: String(row[6] || '')
    });
  }
  return rsvps;
}

/**
 * Lấy toàn bộ dữ liệu hệ thống phục vụ Đồng bộ hai chiều (Full 2-Way Sync)
 */
function getAllDatabaseData() {
  return {
    guests: getAllGuests(),
    wishes: getAllWishes(),
    gifts: getAllGifts(),
    rsvps: getAllRsvps(),
    likes: getLikes()
  };
}

/**
 * Lấy toàn bộ danh sách khách mời từ Sheet
 */
function getAllGuests() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_GUESTS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const guests = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    guests.push({
      stt: row[0],
      code: row[1],
      name: row[2],
      side: row[3],
      phone: row[4],
      relation: row[5],
      link: row[6],
      rsvpStatus: row[7],
      guestCount: row[8],
      notes: row[9],
      updatedAt: row[10]
    });
  }
  return guests;
}

/**
 * Thống kê tổng hợp số liệu
 */
function calculateStats() {
  const guests = getAllGuests();
  let attending = 0;
  let declined = 0;
  let pending = 0;
  let totalAccompanying = 0;

  guests.forEach(g => {
    const s = (g.rsvpStatus || '').toLowerCase();
    if (s.includes('sẽ tham dự') || s.includes('attending') || s.includes('có')) {
      attending++;
      totalAccompanying += (Number(g.guestCount) || 1);
    } else if (s.includes('không thể') || s.includes('declined') || s.includes('bận')) {
      declined++;
    } else {
      pending++;
    }
  });

  return {
    totalGuests: guests.length,
    attendingGuests: attending,
    declinedGuests: declined,
    pendingGuests: pending,
    totalAccompanying: totalAccompanying
  };
}

/**
 * Xử lý Batch Sync (Đồng bộ toàn bộ từ website lên Google Sheet)
 */
function handleBatchSync(payload) {
  setupDatabase();
  const guests = payload.guests || [];
  const rsvps = payload.rsvps || [];
  const wishes = payload.wishes || [];
  const gifts = payload.gifts || [];

  guests.forEach(g => saveOrUpdateGuest(g));
  wishes.forEach(w => recordWish(w));
  gifts.forEach(g => recordGift(g));

  return {
    syncedGuests: guests.length,
    syncedWishes: wishes.length,
    syncedGifts: gifts.length
  };
}

/**
 * ==============================================================================
 * CÁC HÀM ĐỒNG BỘ VÀ TRÌNH BÀY GOOGLE DOC (NẾU DÙNG GOOGLE DOCS)
 * ==============================================================================
 */

/**
 * Khởi tạo định dạng cho file Google Doc
 */
function setupGoogleDocSummary() {
  if (!CONFIG.GOOGLE_DOC_ID) return;
  try {
    const doc = DocumentApp.openById(CONFIG.GOOGLE_DOC_ID);
    const body = doc.getBody();

    // Nếu tài liệu còn trống hoặc chưa có tiêu đề
    if (body.getText().trim().length === 0) {
      const title = body.appendParagraph("💍 SỔ QUẢN TRỊ THIỆP CƯỚI - DUY PHƯƠNG & THÙY DƯƠNG");
      title.setHeading(DocumentApp.ParagraphHeading.TITLE);
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const sub = body.appendParagraph("Cơ sở dữ liệu tự động lưu trữ danh sách khách mời & xác nhận tham dự (RSVP)\nCập nhật tự động thời gian thực từ Website Thiệp Cưới");
      sub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendHorizontalRule();

      body.appendParagraph("1. NHẬT KÝ XÁC NHẬN THAM DỰ (RSVP MỚI NHẤT)")
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);

      body.appendParagraph("2. DANH SÁCH KHÁCH MỜI & LINK THIỆP RIÊNG")
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    }
  } catch (err) {
    Logger.log("Lỗi khởi tạo Google Doc: " + err.toString());
  }
}

/**
 * Ghi nhận RSVP mới vào Google Doc
 */
function appendRsvpToGoogleDoc(rsvpInfo) {
  if (!CONFIG.GOOGLE_DOC_ID) return;
  try {
    const doc = DocumentApp.openById(CONFIG.GOOGLE_DOC_ID);
    const body = doc.getBody();

    const text = `• [${rsvpInfo.timestamp}] ${rsvpInfo.name} (${rsvpInfo.side}) -> ${rsvpInfo.statusStr} (Số lượng: ${rsvpInfo.guestCount} người). Ghi chú: ${rsvpInfo.notes || 'Không có'}`;
    const p = body.appendParagraph(text);
    p.setFontFamily("Roboto");
    p.setFontSize(10);
  } catch (err) {
    Logger.log("Lỗi ghi Google Doc RSVP: " + err.toString());
  }
}

/**
 * Thêm hoặc cập nhật khách mời vào Google Doc
 */
function syncGuestToGoogleDoc(guest, link) {
  if (!CONFIG.GOOGLE_DOC_ID) return;
  try {
    const doc = DocumentApp.openById(CONFIG.GOOGLE_DOC_ID);
    const body = doc.getBody();
    const line = `• ${guest.name} (${guest.side || 'Nhà Trai'}) - SĐT: ${guest.phone || 'Chưa có'} | Link thiệp riêng: ${link || 'Tự động tạo'}`;
    body.appendParagraph(line);
  } catch (err) {
    Logger.log("Lỗi ghi Google Doc Guest: " + err.toString());
  }
}
