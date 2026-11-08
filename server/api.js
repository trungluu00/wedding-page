import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb, generateSlug } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const apiRouter = express.Router();

// Helper to generate IDs
const genId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

// Helper to push updates to Google Apps Script Web App
async function syncToGoogle(action, data) {
  try {
    const db = getDb();
    const config = db.googleConfig;
    if (!config || !config.appsScriptUrl || !config.appsScriptUrl.trim()) {
      return null;
    }
    const res = await fetch(config.appsScriptUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data }),
      redirect: 'follow'
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: res.ok, raw: text };
    }
  } catch (err) {
    console.warn('[GoogleSync] Sync error:', err.message);
    return null;
  }
}

// =============================================================================
// 0. AUTHENTICATION & ADMIN SECURITY
// =============================================================================
const activeSessions = new Set();

apiRouter.post('/auth/login', (req, res) => {
  const { password } = req.body;
  const db = getDb();
  const validPassword = db.adminPassword || 'Peanut@1998';

  if (!password || password !== validPassword) {
    return res.status(401).json({
      success: false,
      message: 'Mật khẩu quản trị không chính xác. Vui lòng thử lại!'
    });
  }

  const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  activeSessions.add(token);

  res.json({
    success: true,
    message: 'Đăng nhập trang quản trị thành công! 💍',
    token
  });
});

apiRouter.post('/auth/verify', (req, res) => {
  const { token } = req.body;
  if (token && activeSessions.has(token)) {
    return res.json({ success: true, valid: true });
  }
  res.json({ success: false, valid: false });
});

apiRouter.post('/auth/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const db = getDb();
  const currentPassword = db.adminPassword || 'Peanut@1998';

  if (!oldPassword || oldPassword !== currentPassword) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu cũ không chính xác!'
    });
  }

  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới phải có ít nhất 3 ký tự!'
    });
  }

  db.adminPassword = newPassword.trim();
  saveDb(db);

  res.json({
    success: true,
    message: 'Đã đổi mật khẩu quản trị thành công!'
  });
});

// 1. WEDDING SETTINGS
apiRouter.get('/wedding', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.wedding });
});

apiRouter.put('/wedding', (req, res) => {
  const db = getDb();
  db.wedding = {
    ...db.wedding,
    ...req.body
  };
  saveDb(db);
  res.json({ success: true, message: 'Đã cập nhật thông tin thiệp cưới thành công!', data: db.wedding });
});

// Upload custom QR image endpoint
apiRouter.post('/upload-qr', (req, res) => {
  try {
    const { image, role = 'custom' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp dữ liệu hình ảnh (base64)!' });
    }

    const match = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Định dạng ảnh base64 không hợp lệ!' });
    }

    let ext = match[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';

    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const qrDir = path.join(rootDir, 'assets', 'images', 'qr');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const safeRole = role === 'bride' ? 'bride' : (role === 'groom' ? 'groom' : 'custom');
    const timestamp = Date.now();
    const finalFileName = `qr-${safeRole}-${timestamp}.${ext}`;
    const filePath = path.join(qrDir, finalFileName);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `assets/images/qr/${finalFileName}`;
    return res.json({
      success: true,
      message: 'Tải lên mã QR thành công!',
      url: relativeUrl,
      fileName: finalFileName
    });
  } catch (err) {
    console.error('Error uploading QR code:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu ảnh: ' + err.message });
  }
});

// 2. DASHBOARD STATS
apiRouter.get('/stats', (req, res) => {
  const db = getDb();
  const guests = db.guests || [];
  const gifts = db.gifts || [];
  const wishes = db.wishes || [];
  const rsvps = db.rsvps || [];

  const totalGuests = guests.length;
  const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending').length;
  const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined').length;
  const pendingGuests = guests.filter(g => !g.rsvpStatus || g.rsvpStatus === 'pending').length;
  
  const totalAccompanying = guests
    .filter(g => g.rsvpStatus === 'attending')
    .reduce((sum, g) => sum + (Number(g.guestCount) || 1), 0);

  const totalGiftMoney = gifts.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  res.json({
    success: true,
    data: {
      totalGuests,
      attendingGuests,
      declinedGuests,
      pendingGuests,
      totalAccompanying,
      totalGifts: gifts.length,
      totalGiftMoney,
      totalWishes: wishes.length,
      totalRsvps: rsvps.length
    }
  });
});

// 3. GUEST MANAGEMENT & PERSONALIZED INVITATIONS
apiRouter.get('/guests', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.guests || [] });
});

apiRouter.get('/guests/lookup', (req, res) => {
  const { code, to } = req.query;
  const queryStr = (code || to || '').trim().toLowerCase();
  
  if (!queryStr) {
    return res.status(400).json({ success: false, message: 'Thiếu mã hoặc tên khách mời' });
  }

  const db = getDb();
  const guest = db.guests.find(g => 
    g.code.toLowerCase() === queryStr || 
    generateSlug(g.name) === queryStr ||
    g.name.toLowerCase() === queryStr
  );

  if (guest) {
    res.json({ success: true, found: true, data: guest });
  } else {
    // If not found in list, return formatted name from query string for custom links
    const formattedName = decodeURIComponent(queryStr)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    res.json({ 
      success: true, 
      found: false, 
      data: {
        name: formattedName,
        side: 'Khách Mời',
        code: queryStr,
        rsvpStatus: 'pending',
        guestCount: 1
      }
    });
  }
});

apiRouter.post('/guests', (req, res) => {
  const { name, phone, side, relation, code, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khách mời' });
  }

  const db = getDb();
  const guestCode = (code && code.trim()) ? generateSlug(code) : generateSlug(name);

  // Check unique code or append random suffix
  let finalCode = guestCode;
  let counter = 1;
  while (db.guests.some(g => g.code === finalCode)) {
    finalCode = `${guestCode}-${counter++}`;
  }

  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol || 'http';
  const personalLink = `${protocol}://${host}/?to=${encodeURIComponent(finalCode)}`;

  const newGuest = {
    id: genId('guest'),
    name: name.trim(),
    phone: phone ? phone.trim() : '',
    side: side || 'Nhà Trai',
    relation: relation ? relation.trim() : 'Bạn bè',
    code: finalCode,
    link: personalLink,
    invited: true,
    rsvpStatus: 'pending',
    guestCount: 1,
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString()
  };

  db.guests.unshift(newGuest);
  saveDb(db);

  // Auto-sync with Google Sheet & Doc Database
  syncToGoogle('addGuest', newGuest).catch(() => {});

  res.status(201).json({ success: true, message: 'Đã thêm khách mời thành công!', data: newGuest });
});

apiRouter.put('/guests/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.guests.findIndex(g => g.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách mời' });
  }

  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol || 'http';
  const currentCode = req.body.code || db.guests[idx].code;
  const personalLink = `${protocol}://${host}/?to=${encodeURIComponent(currentCode)}`;

  db.guests[idx] = {
    ...db.guests[idx],
    ...req.body,
    link: personalLink,
    updatedAt: new Date().toISOString()
  };

  saveDb(db);

  // Auto-sync update with Google Sheet & Doc Database
  syncToGoogle('addGuest', db.guests[idx]).catch(() => {});

  res.json({ success: true, message: 'Đã cập nhật thông tin khách mời!', data: db.guests[idx] });
});

apiRouter.delete('/guests/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.guests.findIndex(g => g.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách mời' });
  }

  const deleted = db.guests.splice(idx, 1)[0];
  saveDb(db);

  // Auto-sync deletion to Google Sheet Database
  syncToGoogle('deleteGuest', { id: deleted.id, code: deleted.code, name: deleted.name }).catch(() => {});

  res.json({ success: true, message: 'Đã xóa khách mời khỏi danh sách!', data: deleted });
});

// 4. WISHES / LỜI CHÚC
apiRouter.get('/wishes', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.wishes || [] });
});

apiRouter.post('/wishes', (req, res) => {
  const { author, relation, text } = req.body;
  if (!author || !author.trim() || !text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và lời chúc' });
  }

  const db = getDb();
  const newWish = {
    id: genId('wish'),
    author: author.trim(),
    relation: relation ? relation.trim() : 'Khách mời',
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  db.wishes.unshift(newWish);
  saveDb(db);

  // Auto-sync with Google Sheet & Doc Database
  syncToGoogle('addWish', newWish).catch(() => {});

  res.status(201).json({ success: true, message: 'Cảm ơn lời chúc ngọt ngào của bạn!', data: newWish });
});

apiRouter.delete('/wishes/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.wishes.findIndex(w => w.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời chúc' });
  }

  const deleted = db.wishes.splice(idx, 1)[0];
  saveDb(db);

  // Auto-sync deletion to Google Sheet Database
  syncToGoogle('deleteWish', { id: deleted.id, author: deleted.author, text: deleted.text }).catch(() => {});

  res.json({ success: true, message: 'Đã xóa lời chúc', data: deleted });
});

// 5. GIFTS / QUÀ TẶNG & TIỀN MỪNG CƯỚI
apiRouter.get('/gifts', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.gifts || [] });
});

apiRouter.post('/gifts', (req, res) => {
  const senderName = req.body.senderName || req.body.sender;
  const { amount, method, message, target } = req.body;
  if (!senderName || !senderName.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên người gửi quà / mừng cưới' });
  }

  const db = getDb();
  const newGift = {
    id: genId('gift'),
    senderName: senderName.trim(),
    target: target ? target.trim() : 'Cả hai vợ chồng',
    amount: Number(amount) || 0,
    method: method ? method.trim() : 'Chuyển khoản QR',
    message: message ? message.trim() : '',
    createdAt: new Date().toISOString()
  };

  db.gifts.unshift(newGift);
  saveDb(db);

  // Auto-sync with Google Sheet & Doc Database
  syncToGoogle('addGift', newGift).catch(() => {});

  res.status(201).json({ success: true, message: 'Đã ghi nhận mừng cưới thành công! Cảm ơn tấm lòng của quý khách ❤️', data: newGift });
});

apiRouter.delete('/gifts/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.gifts.findIndex(g => g.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin mừng cưới' });
  }

  const deleted = db.gifts.splice(idx, 1)[0];
  saveDb(db);

  // Auto-sync deletion to Google Sheet Database
  syncToGoogle('deleteGift', { id: deleted.id, senderName: deleted.senderName, amount: deleted.amount }).catch(() => {});

  res.json({ success: true, message: 'Đã xóa bản ghi mừng cưới', data: deleted });
});

// 5.5. LIKES / TẶNG TIM & LƯỢT THẢ TIM
apiRouter.get('/likes', (req, res) => {
  const db = getDb();
  const count = Number(db.likes?.count) || 88;
  res.json({ success: true, count });
});

apiRouter.post('/likes', (req, res) => {
  const db = getDb();
  if (!db.likes || typeof db.likes !== 'object') {
    db.likes = { count: 88, history: [] };
  }
  const increment = Number(req.body.count) || 1;
  const currentCount = Number(db.likes.count) || 88;
  db.likes.count = currentCount + increment;

  const logItem = {
    id: genId('like'),
    count: db.likes.count,
    increment,
    timestamp: new Date().toISOString()
  };
  if (!Array.isArray(db.likes.history)) db.likes.history = [];
  db.likes.history.unshift(logItem);
  if (db.likes.history.length > 200) db.likes.history = db.likes.history.slice(0, 200);

  saveDb(db);

  // Auto-sync likes to Google Sheet Database
  syncToGoogle('addLike', { totalLikes: db.likes.count, increment, timestamp: logItem.timestamp }).catch(() => {});

  res.json({ success: true, count: db.likes.count });
});

// 6. RSVP ATTENDANCE CONFIRMATION (XÁC ĐỊNH NGƯỜI THAM GIA)
apiRouter.get('/rsvp', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.rsvps || [] });
});

apiRouter.post('/rsvp', (req, res) => {
  const name = (req.body.name || '').trim();
  const side = req.body.side || 'Nhà Trai';
  const willAttend = req.body.willAttend === true || req.body.willAttend === 'yes' || req.body.willAttend === 'true';
  const rawCount = req.body.guestCount ?? req.body.count ?? 1;
  const guestCount = willAttend ? (Math.max(1, parseInt(rawCount, 10) || 1)) : 0;
  const guestCode = (req.body.guestCode ?? req.body.code ?? '').trim();
  const notes = (req.body.notes ?? '').trim();

  if (!name) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên của quý khách' });
  }

  const db = getDb();

  // Link to guest in guest list if exists
  let matchedGuest = null;
  if (guestCode) {
    matchedGuest = db.guests.find(g => g.code.toLowerCase() === guestCode.toLowerCase());
  }
  if (!matchedGuest) {
    matchedGuest = db.guests.find(g => g.name.toLowerCase() === name.toLowerCase());
  }

  if (matchedGuest) {
    matchedGuest.rsvpStatus = willAttend ? 'attending' : 'declined';
    matchedGuest.guestCount = guestCount;
    matchedGuest.updatedAt = new Date().toISOString();
  }

  const newRsvp = {
    id: genId('rsvp'),
    guestId: matchedGuest ? matchedGuest.id : null,
    guestCode: guestCode || (matchedGuest ? matchedGuest.code : ''),
    name,
    side,
    willAttend,
    guestCount,
    notes,
    createdAt: new Date().toISOString()
  };

  db.rsvps.unshift(newRsvp);
  saveDb(db);

  // Auto-sync RSVP confirmation to Google Sheet & Google Doc Database
  syncToGoogle('rsvp', {
    name,
    side,
    willAttend,
    guestCount,
    guestCode: newRsvp.guestCode,
    notes
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: willAttend 
      ? `Cảm ơn ${name}! Hẹn gặp quý khách vào ngày vui của chúng mình ❤️`
      : `Cảm ơn ${name} đã phản hồi. Chúc bạn luôn an khang, hạnh phúc! 🌸`,
    data: newRsvp
  });
});

// =============================================================================
// 7. GOOGLE DOC / GOOGLE SHEET DATABASE SYNC APIS
// =============================================================================

// Get Google integration settings
apiRouter.get('/google/config', (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    data: db.googleConfig || {
      appsScriptUrl: '',
      sheetUrl: '',
      docUrl: '',
      autoSync: true,
      lastSync: null
    }
  });
});

// Update Google integration settings
apiRouter.post('/google/config', (req, res) => {
  const db = getDb();
  db.googleConfig = {
    ...(db.googleConfig || {}),
    ...req.body
  };
  saveDb(db);
  res.json({
    success: true,
    message: 'Đã lưu cấu hình kết nối Google Doc / Sheet Database!',
    data: db.googleConfig
  });
});

// Test connection with Google Apps Script Web App
apiRouter.post('/google/test', async (req, res) => {
  const { appsScriptUrl } = req.body;
  const targetUrl = appsScriptUrl || getDb().googleConfig?.appsScriptUrl;

  if (!targetUrl || !targetUrl.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp URL Google Apps Script Web App' });
  }

  try {
    const url = new URL(targetUrl.trim());
    url.searchParams.set('action', 'ping');

    const response = await fetch(url.toString(), { redirect: 'follow' });
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (response.ok && json.success) {
      res.json({
        success: true,
        message: 'Kết nối Google Sheet & Google Doc Database thành công! 🟢',
        data: json
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Ứng dụng phản hồi nhưng có lỗi: ' + (json.message || text),
        data: json
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Không thể kết nối đến URL Google Apps Script: ' + err.message
    });
  }
});

// Push entire local database to Google Sheet & Doc (Batch Sync)
apiRouter.post('/google/push', async (req, res) => {
  const db = getDb();
  const config = db.googleConfig;

  if (!config || !config.appsScriptUrl || !config.appsScriptUrl.trim()) {
    return res.status(400).json({ success: false, message: 'Chưa cấu hình URL Google Apps Script' });
  }

  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol || 'http';

  // Ensure every guest has their full personalized link
  const guestsWithLinks = (db.guests || []).map(g => ({
    ...g,
    link: g.link || `${protocol}://${host}/?to=${encodeURIComponent(g.code)}`
  }));

  try {
    const result = await syncToGoogle('batchSync', {
      guests: guestsWithLinks,
      rsvps: db.rsvps || [],
      wishes: db.wishes || [],
      gifts: db.gifts || [],
      likes: Number(db.likes?.count) || 88
    });

    db.googleConfig.lastSync = new Date().toISOString();
    saveDb(db);

    res.json({
      success: true,
      message: 'Đã xuất và đồng bộ toàn bộ dữ liệu lên Google Sheet & Doc thành công!',
      data: result,
      lastSync: db.googleConfig.lastSync
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đẩy dữ liệu lên Google: ' + err.message
    });
  }
});

/**
 * Hàm thực thi đồng bộ hai chiều (Two-Way Bi-directional Sync)
 * Khi xóa trên Google Sheet -> Tự động xóa trên website
 * Khi thêm/sửa trên Google Sheet -> Tự động cập nhật về website
 */
export async function executeTwoWayGoogleSync(db, host = 'localhost:5173', protocol = 'http') {
  const config = db.googleConfig;
  if (!config || !config.appsScriptUrl || !config.appsScriptUrl.trim()) {
    throw new Error('Chưa cấu hình URL Google Apps Script');
  }

  let allData = null;
  // 1. Thử gọi action=getAllData (chuẩn hai chiều toàn diện)
  try {
    const url = new URL(config.appsScriptUrl.trim());
    url.searchParams.set('action', 'getAllData');
    const res = await fetch(url.toString(), { redirect: 'follow' });
    const json = await res.json();
    if (json.success && json.data) {
      allData = json.data;
    }
  } catch (err) {
    // Sẽ fallback nếu Apps Script phiên bản cũ
  }

  // 2. Fallback sang action=getGuests nếu script chưa cập nhật getAllData
  if (!allData) {
    const url = new URL(config.appsScriptUrl.trim());
    url.searchParams.set('action', 'getGuests');
    const res = await fetch(url.toString(), { redirect: 'follow' });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      allData = {
        guests: json.data,
        wishes: null,
        gifts: null,
        likes: null
      };
    } else {
      throw new Error(json.message || 'Không thể lấy dữ liệu từ Google Sheet');
    }
  }

  const resultStats = {
    wishesAdded: 0,
    wishesDeleted: 0,
    giftsAdded: 0,
    giftsDeleted: 0,
    guestsAdded: 0,
    guestsUpdated: 0,
    guestsDeleted: 0
  };

  // --- A. ĐỒNG BỘ HAI CHIỀU CHO LỜI CHÚC (WISHES) ---
  if (Array.isArray(allData.wishes)) {
    const googleWishes = allData.wishes;
    if (!Array.isArray(db.wishes)) db.wishes = [];

    // Nếu Google Sheet có danh sách lời chúc:
    // Những lời chúc nào trên web mà KHÔNG còn tồn tại trên Google Sheet (do người dùng xóa trên Sheet) -> Xóa khỏi web!
    if (googleWishes.length > 0) {
      const initialWishesCount = db.wishes.length;
      db.wishes = db.wishes.filter(localWish => {
        return googleWishes.some(gw => {
          if (localWish.id && gw.id && localWish.id === gw.id) return true;
          const authorMatch = String(localWish.author || '').trim().toLowerCase() === String(gw.author || '').trim().toLowerCase();
          const textMatch = String(localWish.text || '').trim().toLowerCase() === String(gw.text || '').trim().toLowerCase();
          return authorMatch && textMatch;
        });
      });
      resultStats.wishesDeleted = initialWishesCount - db.wishes.length;

      // Những lời chúc có trên Google Sheet mà chưa có ở local -> Thêm vào local
      googleWishes.forEach(gw => {
        if (!gw.text && !gw.author) return;
        const exists = db.wishes.some(lw => {
          if (gw.id && lw.id && gw.id === lw.id) return true;
          return String(lw.author || '').trim().toLowerCase() === String(gw.author || '').trim().toLowerCase() &&
                 String(lw.text || '').trim().toLowerCase() === String(gw.text || '').trim().toLowerCase();
        });
        if (!exists) {
          db.wishes.unshift({
            id: gw.id || genId('wish'),
            author: gw.author || 'Khách quý',
            relation: gw.relation || 'Khách mời',
            text: gw.text || '',
            createdAt: gw.timestamp || new Date().toISOString()
          });
          resultStats.wishesAdded++;
        }
      });
    } else if (googleWishes.length === 0 && config.lastSync) {
      resultStats.wishesDeleted = db.wishes.length;
      db.wishes = [];
    }
  }

  // --- B. ĐỒNG BỘ HAI CHIỀU CHO QUÀ MỪNG & TIỀN MỪNG (GIFTS) ---
  if (Array.isArray(allData.gifts)) {
    const googleGifts = allData.gifts;
    if (!Array.isArray(db.gifts)) db.gifts = [];

    if (googleGifts.length > 0) {
      const initialGiftsCount = db.gifts.length;
      db.gifts = db.gifts.filter(localGift => {
        return googleGifts.some(gg => {
          if (localGift.id && gg.id && localGift.id === gg.id) return true;
          const senderMatch = String(localGift.senderName || '').trim().toLowerCase() === String(gg.senderName || '').trim().toLowerCase();
          const amountMatch = Number(localGift.amount) === Number(gg.amount);
          return senderMatch && amountMatch;
        });
      });
      resultStats.giftsDeleted = initialGiftsCount - db.gifts.length;

      // Thêm quà mới từ Google Sheet vào local nếu chưa có
      googleGifts.forEach(gg => {
        if (!gg.senderName) return;
        const exists = db.gifts.some(lg => {
          if (gg.id && lg.id && gg.id === lg.id) return true;
          return String(lg.senderName || '').trim().toLowerCase() === String(gg.senderName || '').trim().toLowerCase() &&
                 Number(lg.amount) === Number(gg.amount);
        });
        if (!exists) {
          db.gifts.unshift({
            id: gg.id || genId('gift'),
            senderName: gg.senderName,
            target: gg.target || 'Cả hai vợ chồng',
            amount: Number(gg.amount) || 0,
            method: gg.method || 'Chuyển khoản QR',
            message: gg.message || '',
            createdAt: gg.timestamp || new Date().toISOString()
          });
          resultStats.giftsAdded++;
        }
      });
    } else if (googleGifts.length === 0 && config.lastSync) {
      resultStats.giftsDeleted = db.gifts.length;
      db.gifts = [];
    }
  }

  // --- C. ĐỒNG BỘ HAI CHIỀU CHO KHÁCH MỜI (GUESTS) ---
  if (Array.isArray(allData.guests)) {
    const googleGuests = allData.guests;
    if (!Array.isArray(db.guests)) db.guests = [];

    if (googleGuests.length > 0) {
      // Xóa khách mời ở local nếu đã bị xóa trên Google Sheet
      const initialGuestsCount = db.guests.length;
      db.guests = db.guests.filter(lg => {
        return googleGuests.some(gg => {
          const codeMatch = lg.code && gg.code && lg.code.toLowerCase() === gg.code.toLowerCase();
          const nameMatch = lg.name && gg.name && lg.name.toLowerCase() === gg.name.trim().toLowerCase();
          return codeMatch || nameMatch;
        });
      });
      resultStats.guestsDeleted = initialGuestsCount - db.guests.length;

      // Cập nhật hoặc thêm khách mời từ Google Sheet
      googleGuests.forEach(gg => {
        if (!gg.name || !gg.name.trim()) return;
        const code = gg.code || generateSlug(gg.name);
        const existingIdx = db.guests.findIndex(g => 
          g.code.toLowerCase() === code.toLowerCase() ||
          g.name.toLowerCase() === gg.name.trim().toLowerCase()
        );

        const rsvpStatus = (gg.rsvpStatus || '').includes('tham dự') ? 'attending' 
          : (gg.rsvpStatus || '').includes('không') ? 'declined' 
          : 'pending';

        const personalLink = gg.link || `${protocol}://${host}/?to=${encodeURIComponent(code)}`;

        if (existingIdx !== -1) {
          db.guests[existingIdx] = {
            ...db.guests[existingIdx],
            name: gg.name,
            side: gg.side || db.guests[existingIdx].side,
            phone: gg.phone || db.guests[existingIdx].phone,
            relation: gg.relation || db.guests[existingIdx].relation,
            code: code,
            link: personalLink,
            rsvpStatus: rsvpStatus,
            guestCount: Number(gg.guestCount) || db.guests[existingIdx].guestCount || 1,
            notes: gg.notes || db.guests[existingIdx].notes,
            updatedAt: new Date().toISOString()
          };
          resultStats.guestsUpdated++;
        } else {
          db.guests.push({
            id: genId('guest'),
            name: gg.name.trim(),
            side: gg.side || 'Nhà Trai',
            phone: gg.phone || '',
            relation: gg.relation || 'Bạn bè',
            code: code,
            link: personalLink,
            invited: true,
            rsvpStatus: rsvpStatus,
            guestCount: Number(gg.guestCount) || 1,
            notes: gg.notes || '',
            createdAt: new Date().toISOString()
          });
          resultStats.guestsAdded++;
        }
      });
    }
  }

  // --- D. ĐỒNG BỘ LƯỢT THẢ TIM (LIKES) ---
  if (allData.likes && typeof allData.likes.count === 'number' && allData.likes.count > 0) {
    if (!db.likes || typeof db.likes !== 'object') db.likes = { count: 88, history: [] };
    if (allData.likes.count > db.likes.count) {
      db.likes.count = allData.likes.count;
    }
  }

  db.googleConfig.lastSync = new Date().toISOString();
  saveDb(db);

  return {
    stats: resultStats,
    lastSync: db.googleConfig.lastSync,
    wishesCount: (db.wishes || []).length,
    giftsCount: (db.gifts || []).length,
    guestsCount: (db.guests || []).length,
    likesCount: Number(db.likes?.count) || 88
  };
}

// Pull & Full Two-Way Sync from Google Sheet into local database
apiRouter.post('/google/pull', async (req, res) => {
  const db = getDb();
  const config = db.googleConfig;

  if (!config || !config.appsScriptUrl || !config.appsScriptUrl.trim()) {
    return res.status(400).json({ success: false, message: 'Chưa cấu hình URL Google Apps Script' });
  }

  const host = req.get('host') || 'localhost:5173';
  const protocol = req.protocol || 'http';

  try {
    const syncResult = await executeTwoWayGoogleSync(db, host, protocol);

    res.json({
      success: true,
      message: `Đồng bộ hai chiều với Google Sheet thành công! (Khách: +${syncResult.stats.guestsAdded} ~${syncResult.stats.guestsUpdated} -${syncResult.stats.guestsDeleted}; Lời chúc: +${syncResult.stats.wishesAdded} -${syncResult.stats.wishesDeleted}; Quà mừng: +${syncResult.stats.giftsAdded} -${syncResult.stats.giftsDeleted})`,
      data: syncResult,
      lastSync: syncResult.lastSync
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ dữ liệu từ Google Sheet: ' + err.message
    });
  }
});

// Thiết lập định kỳ tự động đồng bộ hai chiều ngầm (mỗi 3 phút)
let autoSyncInterval = null;
function initBackgroundSync() {
  if (autoSyncInterval) return;
  autoSyncInterval = setInterval(async () => {
    try {
      const db = getDb();
      if (db.googleConfig && db.googleConfig.appsScriptUrl && db.googleConfig.autoSync !== false) {
        await executeTwoWayGoogleSync(db, 'localhost:5173', 'http');
      }
    } catch (e) {
      // background silent ignore
    }
  }, 180000);
}
initBackgroundSync();
