/**
 * ADMIN DASHBOARD CONTROLLER (SONG HỶ XANH)
 */

const API_BASE = '/api';

// State
let allGuests = [];
let allWishes = [];
let allGifts = [];
let currentWedding = {};

// Helper: Toast notification
function showToast(message) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Helper: Format Currency
function formatVND(amount) {
  return (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';
}

// Helper: Format Date
function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Tab navigation
window.switchTab = function(tabId) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabId}`);
  });

  if (tabId === 'dashboard') loadStats();
  if (tabId === 'guests') loadGuests();
  if (tabId === 'google') { loadGoogleConfig(); loadRsvpLog(); }
  if (tabId === 'wishes') loadWishes();
  if (tabId === 'gifts') loadGifts();
  if (tabId === 'settings') loadSettings();
};

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');
    switchTab(tabId);
  });
});

// Modals
window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
};

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });
});

// =============================================================================
// 1. DASHBOARD STATS
// =============================================================================
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const json = await res.json();
    if (json.success) {
      const d = json.data;
      document.getElementById('statTotalGuests').textContent = d.totalGuests;
      document.getElementById('statAttendingGuests').textContent = `${d.attendingGuests} khách`;
      document.getElementById('statTotalAccompanying').textContent = `${d.totalAccompanying} người`;
      document.getElementById('statDeclinedGuests').textContent = `${d.declinedGuests} khách`;
      document.getElementById('statPendingGuests').textContent = `${d.pendingGuests} khách`;
      document.getElementById('statTotalWishes').textContent = `${d.totalWishes} lời chúc`;
      document.getElementById('statTotalGiftMoney').textContent = formatVND(d.totalGiftMoney);
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

document.getElementById('btnRefreshStats')?.addEventListener('click', () => {
  loadStats();
  showToast('Đã làm mới số liệu thống kê!');
});

// =============================================================================
// 2. GUESTS & PERSONAL LINKS
// =============================================================================
async function loadGuests() {
  try {
    const res = await fetch(`${API_BASE}/guests`);
    const json = await res.json();
    if (json.success) {
      allGuests = json.data;
      renderGuestsTable();
    }
  } catch (err) {
    console.error('Error loading guests:', err);
  }
}

function renderGuestsTable() {
  const tbody = document.getElementById('guestsTableBody');
  if (!tbody) return;

  const searchTerm = (document.getElementById('guestSearchInput')?.value || '').toLowerCase().trim();
  const filterSide = document.getElementById('filterSide')?.value || 'all';
  const filterRsvp = document.getElementById('filterRsvp')?.value || 'all';

  const origin = window.location.origin;

  const filtered = allGuests.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(searchTerm) ||
                        (g.phone && g.phone.includes(searchTerm)) ||
                        g.code.toLowerCase().includes(searchTerm);
    const matchSide = filterSide === 'all' || g.side === filterSide;
    const matchRsvp = filterRsvp === 'all' || 
                      (filterRsvp === 'pending' && (!g.rsvpStatus || g.rsvpStatus === 'pending')) ||
                      g.rsvpStatus === filterRsvp;
    return matchSearch && matchSide && matchRsvp;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; padding: 30px;">Không có khách mời nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(g => {
    const personalUrl = `${origin}/?to=${encodeURIComponent(g.code)}`;
    
    // Side badge style
    let sideClass = 'trai';
    if (g.side === 'Nhà Gái') sideClass = 'gai';
    if (g.side === 'Bạn Cả Hai') sideClass = 'chung';

    // RSVP badge style
    let rsvpBadge = `<span class="badge-rsvp pending">⏳ Chưa phản hồi</span>`;
    if (g.rsvpStatus === 'attending') {
      rsvpBadge = `<span class="badge-rsvp attending">✓ Sẽ tham dự</span>`;
    } else if (g.rsvpStatus === 'declined') {
      rsvpBadge = `<span class="badge-rsvp declined">✕ Không thể đến</span>`;
    }

    return `
      <tr>
        <td><strong>${g.name}</strong></td>
        <td><span class="badge-side ${sideClass}">${g.side}</span></td>
        <td>
          <div>${g.relation || 'Bạn bè'}</div>
          <small style="color: #888;">${g.phone || 'Chưa có SĐT'}</small>
        </td>
        <td>${rsvpBadge}</td>
        <td><strong>${g.rsvpStatus === 'attending' ? (g.guestCount || 1) : '-'}</strong></td>
        <td>
          <div class="copy-link-cell">
            <input type="text" class="link-input-mini" readonly value="${personalUrl}">
            <button class="btn-copy-zalo" onclick="copyPersonalInvite('${g.id}', '${encodeURIComponent(g.name)}', '${personalUrl}')" title="Sao chép tin nhắn Zalo kèm link">
              📋 Gửi Zalo
            </button>
          </div>
        </td>
        <td>
          <button class="btn-icon-table" onclick="editGuest('${g.id}')" title="Sửa">✏️</button>
          <button class="btn-icon-table delete" onclick="deleteGuest('${g.id}')" title="Xóa">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Search & filter listeners
document.getElementById('guestSearchInput')?.addEventListener('input', renderGuestsTable);
document.getElementById('filterSide')?.addEventListener('change', renderGuestsTable);
document.getElementById('filterRsvp')?.addEventListener('change', renderGuestsTable);

// Add Guest Modal
document.getElementById('btnOpenAddGuestModal')?.addEventListener('click', () => {
  document.getElementById('guestModalTitle').textContent = 'Thêm Khách Mời Mới';
  document.getElementById('editGuestId').value = '';
  document.getElementById('guestForm').reset();
  openModal('guestModal');
});

// Edit Guest
window.editGuest = function(id) {
  const g = allGuests.find(x => x.id === id);
  if (!g) return;

  document.getElementById('guestModalTitle').textContent = 'Chỉnh Sửa Khách Mời';
  document.getElementById('editGuestId').value = g.id;
  document.getElementById('guestInputName').value = g.name || '';
  document.getElementById('guestInputSide').value = g.side || 'Nhà Trai';
  document.getElementById('guestInputRelation').value = g.relation || '';
  document.getElementById('guestInputPhone').value = g.phone || '';
  document.getElementById('guestInputCode').value = g.code || '';
  document.getElementById('guestInputNotes').value = g.notes || '';

  openModal('guestModal');
};

// Save Guest (Add or Update)
document.getElementById('guestForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editGuestId').value;
  const name = document.getElementById('guestInputName').value.trim();
  const side = document.getElementById('guestInputSide').value;
  const relation = document.getElementById('guestInputRelation').value.trim();
  const phone = document.getElementById('guestInputPhone').value.trim();
  const code = document.getElementById('guestInputCode').value.trim();
  const notes = document.getElementById('guestInputNotes').value.trim();

  const payload = { name, side, relation, phone, code, notes };

  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE}/guests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_BASE}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const json = await res.json();
    if (json.success) {
      closeModal('guestModal');
      showToast(json.message);
      loadGuests();
      loadStats();
    } else {
      alert(json.message);
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi lưu khách mời');
  }
});

// Delete Guest
window.deleteGuest = async function(id) {
  const g = allGuests.find(x => x.id === id);
  if (!g) return;
  if (!confirm(`Bạn có chắc muốn xóa khách mời "${g.name}" khỏi danh sách?`)) return;

  try {
    const res = await fetch(`${API_BASE}/guests/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Đã xóa khách mời!');
      loadGuests();
      loadStats();
    }
  } catch (err) {
    console.error(err);
  }
};

// 1-Click Copy Zalo Invite Message
window.copyPersonalInvite = function(id, encodedName, link) {
  const guestName = decodeURIComponent(encodedName);
  const groom = currentWedding.groomShortName || 'Duy Phương';
  const bride = currentWedding.brideShortName || 'Thùy Dương';
  const date = currentWedding.weddingDateDisplay || '30 tháng 7, 2026';

  const message = `Trân trọng kính mời ${guestName} đến tham dự lễ thành hôn của ${groom} & ${bride} vào ngày ${date}.\n\nThiệp mời dành riêng cho quý khách:\n👉 ${link}\n\nSự hiện diện của ${guestName} là niềm vinh hạnh lớn nhất cho gia đình chúng mình! ❤️`;

  navigator.clipboard.writeText(message).then(() => {
    showToast(`Đã chép lời mời riêng cho ${guestName}! Có thể dán gửi ngay qua Zalo/Facebook.`);
  }).catch(() => {
    navigator.clipboard.writeText(link);
    showToast(`Đã sao chép link thiệp: ${link}`);
  });
};

// =============================================================================
// 3. WISHES / GUESTBOOK
// =============================================================================
async function loadWishes() {
  try {
    const res = await fetch(`${API_BASE}/wishes`);
    const json = await res.json();
    if (json.success) {
      allWishes = json.data;
      renderWishes();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderWishes() {
  const container = document.getElementById('wishesGridContainer');
  if (!container) return;

  if (allWishes.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px;">Chưa có lời chúc nào được gửi</div>`;
    return;
  }

  container.innerHTML = allWishes.map(w => `
    <div class="wish-card-item">
      <div>
        <div class="wish-card-header">
          <div>
            <div class="wish-author">${w.author}</div>
            <span class="wish-relation">${w.relation || 'Khách mời'}</span>
          </div>
          <button class="btn-icon-table delete" onclick="deleteWish('${w.id}')" title="Xóa lời chúc">🗑️</button>
        </div>
        <p class="wish-text">“${w.text}”</p>
      </div>
      <div class="wish-footer">
        <span>🕒 ${formatDate(w.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

window.deleteWish = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa lời chúc này?')) return;
  try {
    const res = await fetch(`${API_BASE}/wishes/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Đã xóa lời chúc!');
      loadWishes();
      loadStats();
    }
  } catch (err) {
    console.error(err);
  }
};

document.getElementById('btnRefreshWishes')?.addEventListener('click', () => {
  loadWishes();
  showToast('Đã làm mới danh sách lời chúc!');
});

// =============================================================================
// 4. GIFTS / QUÀ MỪNG CƯỚI
// =============================================================================
async function loadGifts() {
  try {
    const res = await fetch(`${API_BASE}/gifts`);
    const json = await res.json();
    if (json.success) {
      allGifts = json.data;
      renderGiftsTable();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderGiftsTable() {
  const tbody = document.getElementById('giftsTableBody');
  if (!tbody) return;

  if (allGifts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 30px;">Chưa ghi nhận khoản mừng cưới nào</td></tr>`;
    return;
  }

  tbody.innerHTML = allGifts.map(g => `
    <tr>
      <td><strong>${g.senderName || g.sender || 'Ẩn danh'}</strong></td>
      <td><strong style="color: #b7811f; font-size: 1rem;">${formatVND(g.amount)}</strong></td>
      <td><span class="badge-side chung">${g.method || 'Chuyển khoản'}</span></td>
      <td>${g.message || '—'}</td>
      <td><small style="color: #888;">${formatDate(g.createdAt)}</small></td>
      <td>
        <button class="btn-icon-table delete" onclick="deleteGift('${g.id}')" title="Xóa bản ghi">🗑️</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('btnOpenAddGiftModal')?.addEventListener('click', () => {
  document.getElementById('giftForm').reset();
  openModal('giftModal');
});

document.getElementById('giftForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const senderName = document.getElementById('giftInputSender').value.trim();
  const amount = Number(document.getElementById('giftInputAmount').value) || 0;
  const method = document.getElementById('giftInputMethod').value;
  const message = document.getElementById('giftInputMessage').value.trim();

  try {
    const res = await fetch(`${API_BASE}/gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName, amount, method, message })
    });
    const json = await res.json();
    if (json.success) {
      closeModal('giftModal');
      showToast(json.message);
      loadGifts();
      loadStats();
    }
  } catch (err) {
    console.error(err);
  }
});

window.deleteGift = async function(id) {
  if (!confirm('Bạn có chắc muốn xóa bản ghi mừng cưới này?')) return;
  try {
    const res = await fetch(`${API_BASE}/gifts/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Đã xóa bản ghi mừng cưới!');
      loadGifts();
      loadStats();
    }
  } catch (err) {
    console.error(err);
  }
};

// =============================================================================
// 5. WEDDING SETTINGS
// =============================================================================
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/wedding`);
    const json = await res.json();
    if (json.success) {
      currentWedding = json.data;
      const w = currentWedding;

      document.getElementById('settingGroomName').value = w.groomName || '';
      document.getElementById('settingGroomShortName').value = w.groomShortName || '';
      document.getElementById('settingBrideName').value = w.brideName || '';
      document.getElementById('settingBrideShortName').value = w.brideShortName || '';

      document.getElementById('settingGroomFather').value = w.groomFather || '';
      document.getElementById('settingGroomMother').value = w.groomMother || '';
      document.getElementById('settingGroomAddress').value = w.groomAddress || '';

      document.getElementById('settingBrideFather').value = w.brideFather || '';
      document.getElementById('settingBrideMother').value = w.brideMother || '';
      document.getElementById('settingBrideAddress').value = w.brideAddress || '';

      document.getElementById('settingWeddingDate').value = w.weddingDate || '';
      document.getElementById('settingWeddingDateDisplay').value = w.weddingDateDisplay || '';
      document.getElementById('settingLunarDateDisplay').value = w.lunarDateDisplay || '';
      document.getElementById('settingWeddingTime').value = w.weddingTime || '';
      document.getElementById('settingVenueName').value = w.venueName || '';
      document.getElementById('settingVenueAddress').value = w.venueAddress || '';
      document.getElementById('settingGoogleMapsUrl').value = w.googleMapsUrl || '';

      const cerNameEl = document.getElementById('settingCeremonyName');
      const cerTimeEl = document.getElementById('settingCeremonyTime');
      const cerAddrEl = document.getElementById('settingCeremonyAddress');
      if (cerNameEl) cerNameEl.value = w.ceremonyName || '';
      if (cerTimeEl) cerTimeEl.value = w.ceremonyTime || '';
      if (cerAddrEl) cerAddrEl.value = w.ceremonyAddress || '';

      document.getElementById('settingGroomBank').value = w.groomBank || '';
      document.getElementById('settingGroomAccount').value = w.groomAccount || '';
      document.getElementById('settingGroomAccountName').value = w.groomAccountName || '';

      document.getElementById('settingBrideBank').value = w.brideBank || '';
      document.getElementById('settingBrideAccount').value = w.brideAccount || '';
      document.getElementById('settingBrideAccountName').value = w.brideAccountName || '';

      // Initialize QR UI for Groom and Bride
      updateQrUi('groom', w.groomQrImage || '', w.groomBank, w.groomAccount, w.groomAccountName, w.groomShortName);
      updateQrUi('bride', w.brideQrImage || '', w.brideBank, w.brideAccount, w.brideAccountName, w.brideShortName);

      // Initialize Contact Information
      const groomPhoneEl = document.getElementById('settingGroomPhone');
      const groomRepNameEl = document.getElementById('settingGroomRepName');
      const groomRepRoleEl = document.getElementById('settingGroomRepRole');
      const groomRepPhoneEl = document.getElementById('settingGroomRepPhone');
      if (groomPhoneEl) groomPhoneEl.value = w.groomPhone || '';
      if (groomRepNameEl) groomRepNameEl.value = w.groomRepName || w.groomFather || '';
      if (groomRepRoleEl) groomRepRoleEl.value = w.groomRepRole || 'Đại diện Nhà trai (Bố chú rể)';
      if (groomRepPhoneEl) groomRepPhoneEl.value = w.groomRepPhone || '';

      const bridePhoneEl = document.getElementById('settingBridePhone');
      const brideRepNameEl = document.getElementById('settingBrideRepName');
      const brideRepRoleEl = document.getElementById('settingBrideRepRole');
      const brideRepPhoneEl = document.getElementById('settingBrideRepPhone');
      if (bridePhoneEl) bridePhoneEl.value = w.bridePhone || '';
      if (brideRepNameEl) brideRepNameEl.value = w.brideRepName || w.brideFather || '';
      if (brideRepRoleEl) brideRepRoleEl.value = w.brideRepRole || 'Đại diện Nhà gái (Bố cô dâu)';
      if (brideRepPhoneEl) brideRepPhoneEl.value = w.brideRepPhone || '';
    }
  } catch (err) {
    console.error('Error loading wedding settings:', err);
  }
}

// Helper: Sinh URL VietQR tự động khi không có ảnh tải lên
function getAutoVietQrUrl(bank, account, name, shortName) {
  if (!account) return '';
  const bankLower = (bank || '').toLowerCase();
  let bin = '970436'; // Default Vietcombank
  if (bankLower.includes('bidv')) bin = '970418';
  else if (bankLower.includes('vietcombank')) bin = '970436';
  else if (bankLower.includes('tpbank') || bankLower.includes('tp bank')) bin = '970458';
  else if (bankLower.includes('mbbank') || bankLower.includes('mb bank') || bankLower.includes('quân đội')) bin = '970422';
  else if (bankLower.includes('techcombank')) bin = '970407';
  else if (bankLower.includes('acb')) bin = '970416';
  else if (bankLower.includes('vpbank')) bin = '970432';
  else if (bankLower.includes('vietinbank')) bin = '970415';
  else if (bankLower.includes('agribank')) bin = '970405';

  const memo = encodeURIComponent(`Mung cuoi ${shortName || ''}`);
  const accName = encodeURIComponent(name || '');
  return `https://api.vietqr.io/image/${bin}-${account}-compact2.png?amount=0&addInfo=${memo}&accountName=${accName}`;
}

// Cập nhật giao diện khung QR Preview & Badge
function updateQrUi(role, customUrl, bank, account, name, shortName) {
  const isGroom = role === 'groom';
  const previewEl = document.getElementById(isGroom ? 'previewGroomQr' : 'previewBrideQr');
  const hiddenInput = document.getElementById(isGroom ? 'settingGroomQrImage' : 'settingBrideQrImage');
  const badgeEl = document.getElementById(isGroom ? 'groomQrTypeBadge' : 'brideQrTypeBadge');
  const statusEl = document.getElementById(isGroom ? 'groomQrStatusText' : 'brideQrStatusText');

  if (!previewEl || !hiddenInput || !badgeEl || !statusEl) return;

  if (customUrl && customUrl.trim()) {
    hiddenInput.value = customUrl.trim();
    previewEl.src = customUrl.trim();
    badgeEl.textContent = 'Ảnh Tùy Chỉnh';
    badgeEl.className = 'qr-badge badge-custom';
    statusEl.textContent = '✓ Đang dùng ảnh QR đã tải lên';
    statusEl.style.color = '#2E7D32';
  } else {
    hiddenInput.value = '';
    const autoUrl = getAutoVietQrUrl(bank, account, name, shortName);
    if (autoUrl) {
      previewEl.src = autoUrl;
      statusEl.textContent = 'Đang dùng mã VietQR tự động';
    } else {
      previewEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f5f5f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="11">Chưa có QR</text></svg>';
      statusEl.textContent = 'Nhập số tài khoản để tạo QR';
    }
    badgeEl.textContent = 'QR Tự Động';
    badgeEl.className = 'qr-badge badge-auto';
    statusEl.style.color = 'var(--adm-text-muted)';
  }
}

// Xử lý đọc file và gửi lên API
async function handleQrFileUpload(role, file) {
  if (!file) return;
  const isGroom = role === 'groom';
  const statusEl = document.getElementById(isGroom ? 'groomQrStatusText' : 'brideQrStatusText');
  const previewEl = document.getElementById(isGroom ? 'previewGroomQr' : 'previewBrideQr');
  const badgeEl = document.getElementById(isGroom ? 'groomQrTypeBadge' : 'brideQrTypeBadge');
  const hiddenInput = document.getElementById(isGroom ? 'settingGroomQrImage' : 'settingBrideQrImage');

  if (statusEl) {
    statusEl.textContent = '⏳ Đang tải ảnh lên...';
    statusEl.style.color = 'var(--adm-primary)';
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    if (previewEl) previewEl.src = base64Data;
    if (hiddenInput) hiddenInput.value = base64Data;
    if (badgeEl) {
      badgeEl.textContent = 'Ảnh Tùy Chỉnh';
      badgeEl.className = 'qr-badge badge-custom';
    }

    try {
      const res = await fetch(`${API_BASE}/upload-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          image: base64Data,
          fileName: file.name
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (hiddenInput) hiddenInput.value = data.url;
        if (previewEl) previewEl.src = data.url;
        if (statusEl) {
          statusEl.textContent = `✓ Đã tải ảnh lên thành công!`;
          statusEl.style.color = '#2E7D32';
        }
        showToast(`Đã tải ảnh mã QR ${isGroom ? 'Chú Rể' : 'Cô Dâu'} thành công! Hãy bấm Lưu Cài Đặt.`);
      } else {
        if (statusEl) {
          statusEl.textContent = '✓ Đã sẵn sàng ảnh QR';
          statusEl.style.color = '#2E7D32';
        }
      }
    } catch (err) {
      console.warn('Upload API error, using base64 fallback:', err);
      if (statusEl) {
        statusEl.textContent = '✓ Đã sẵn sàng ảnh QR';
        statusEl.style.color = '#2E7D32';
      }
    }
  };
  reader.readAsDataURL(file);
}

// Bắt sự kiện click chọn file & reset QR Chú Rể
document.getElementById('btnUploadGroomQr')?.addEventListener('click', () => {
  document.getElementById('uploadGroomQrFile')?.click();
});
document.getElementById('uploadGroomQrFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleQrFileUpload('groom', file);
});
document.getElementById('btnResetGroomQr')?.addEventListener('click', () => {
  const bank = document.getElementById('settingGroomBank')?.value.trim() || '';
  const acc = document.getElementById('settingGroomAccount')?.value.trim() || '';
  const name = document.getElementById('settingGroomAccountName')?.value.trim() || '';
  const shortName = document.getElementById('settingGroomShortName')?.value.trim() || '';
  const fileInput = document.getElementById('uploadGroomQrFile');
  if (fileInput) fileInput.value = '';
  updateQrUi('groom', '', bank, acc, name, shortName);
  showToast('Đã chuyển về mã VietQR tự động của Chú Rể');
});

// Bắt sự kiện click chọn file & reset QR Cô Dâu
document.getElementById('btnUploadBrideQr')?.addEventListener('click', () => {
  document.getElementById('uploadBrideQrFile')?.click();
});
document.getElementById('uploadBrideQrFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleQrFileUpload('bride', file);
});
document.getElementById('btnResetBrideQr')?.addEventListener('click', () => {
  const bank = document.getElementById('settingBrideBank')?.value.trim() || '';
  const acc = document.getElementById('settingBrideAccount')?.value.trim() || '';
  const name = document.getElementById('settingBrideAccountName')?.value.trim() || '';
  const shortName = document.getElementById('settingBrideShortName')?.value.trim() || '';
  const fileInput = document.getElementById('uploadBrideQrFile');
  if (fileInput) fileInput.value = '';
  updateQrUi('bride', '', bank, acc, name, shortName);
  showToast('Đã chuyển về mã VietQR tự động của Cô Dâu');
});

// Khi thay đổi số tài khoản hoặc ngân hàng, tự cập nhật lại preview nếu đang ở chế độ auto
['settingGroomBank', 'settingGroomAccount', 'settingGroomAccountName', 'settingGroomShortName'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    const hidden = document.getElementById('settingGroomQrImage');
    if (!hidden || !hidden.value) {
      const bank = document.getElementById('settingGroomBank')?.value.trim() || '';
      const acc = document.getElementById('settingGroomAccount')?.value.trim() || '';
      const name = document.getElementById('settingGroomAccountName')?.value.trim() || '';
      const shortName = document.getElementById('settingGroomShortName')?.value.trim() || '';
      updateQrUi('groom', '', bank, acc, name, shortName);
    }
  });
});

['settingBrideBank', 'settingBrideAccount', 'settingBrideAccountName', 'settingBrideShortName'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    const hidden = document.getElementById('settingBrideQrImage');
    if (!hidden || !hidden.value) {
      const bank = document.getElementById('settingBrideBank')?.value.trim() || '';
      const acc = document.getElementById('settingBrideAccount')?.value.trim() || '';
      const name = document.getElementById('settingBrideAccountName')?.value.trim() || '';
      const shortName = document.getElementById('settingBrideShortName')?.value.trim() || '';
      updateQrUi('bride', '', bank, acc, name, shortName);
    }
  });
});

document.getElementById('weddingSettingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    groomName: document.getElementById('settingGroomName').value.trim(),
    groomShortName: document.getElementById('settingGroomShortName').value.trim(),
    brideName: document.getElementById('settingBrideName').value.trim(),
    brideShortName: document.getElementById('settingBrideShortName').value.trim(),

    groomFather: document.getElementById('settingGroomFather').value.trim(),
    groomMother: document.getElementById('settingGroomMother').value.trim(),
    groomAddress: document.getElementById('settingGroomAddress').value.trim(),

    brideFather: document.getElementById('settingBrideFather').value.trim(),
    brideMother: document.getElementById('settingBrideMother').value.trim(),
    brideAddress: document.getElementById('settingBrideAddress').value.trim(),

    weddingDate: document.getElementById('settingWeddingDate').value,
    weddingDateDisplay: document.getElementById('settingWeddingDateDisplay').value.trim(),
    lunarDateDisplay: document.getElementById('settingLunarDateDisplay').value.trim(),
    weddingTime: document.getElementById('settingWeddingTime').value.trim(),
    venueName: document.getElementById('settingVenueName').value.trim(),
    venueAddress: document.getElementById('settingVenueAddress').value.trim(),
    googleMapsUrl: document.getElementById('settingGoogleMapsUrl').value.trim(),

    ceremonyName: document.getElementById('settingCeremonyName') ? document.getElementById('settingCeremonyName').value.trim() : '',
    ceremonyTime: document.getElementById('settingCeremonyTime') ? document.getElementById('settingCeremonyTime').value.trim() : '',
    ceremonyAddress: document.getElementById('settingCeremonyAddress') ? document.getElementById('settingCeremonyAddress').value.trim() : '',

    groomBank: document.getElementById('settingGroomBank').value.trim(),
    groomAccount: document.getElementById('settingGroomAccount').value.trim(),
    groomAccountName: document.getElementById('settingGroomAccountName').value.trim(),
    groomQrImage: document.getElementById('settingGroomQrImage') ? document.getElementById('settingGroomQrImage').value.trim() : '',

    brideBank: document.getElementById('settingBrideBank').value.trim(),
    brideAccount: document.getElementById('settingBrideAccount').value.trim(),
    brideAccountName: document.getElementById('settingBrideAccountName').value.trim(),
    brideQrImage: document.getElementById('settingBrideQrImage') ? document.getElementById('settingBrideQrImage').value.trim() : '',

    groomPhone: document.getElementById('settingGroomPhone') ? document.getElementById('settingGroomPhone').value.trim() : '',
    groomRepName: document.getElementById('settingGroomRepName') ? document.getElementById('settingGroomRepName').value.trim() : '',
    groomRepRole: document.getElementById('settingGroomRepRole') ? document.getElementById('settingGroomRepRole').value.trim() : '',
    groomRepPhone: document.getElementById('settingGroomRepPhone') ? document.getElementById('settingGroomRepPhone').value.trim() : '',

    bridePhone: document.getElementById('settingBridePhone') ? document.getElementById('settingBridePhone').value.trim() : '',
    brideRepName: document.getElementById('settingBrideRepName') ? document.getElementById('settingBrideRepName').value.trim() : '',
    brideRepRole: document.getElementById('settingBrideRepRole') ? document.getElementById('settingBrideRepRole').value.trim() : '',
    brideRepPhone: document.getElementById('settingBrideRepPhone') ? document.getElementById('settingBrideRepPhone').value.trim() : ''
  };

  try {
    const res = await fetch(`${API_BASE}/wedding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      currentWedding = json.data;
      showToast('Đã lưu toàn bộ cài đặt thiệp cưới thành công!');
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi lưu cài đặt!');
  }
});

// =============================================================================
// 7. GOOGLE DOC & GOOGLE SHEET DATABASE CONTROLLER
// =============================================================================

let currentGoogleConfig = {};

async function loadGoogleConfig() {
  try {
    const res = await fetch(`${API_BASE}/google/config`);
    const json = await res.json();
    if (json.success && json.data) {
      currentGoogleConfig = json.data;
      const c = currentGoogleConfig;

      const inputUrl = document.getElementById('inputGoogleAppsScriptUrl');
      const inputSheet = document.getElementById('inputGoogleSheetUrl');
      const inputDoc = document.getElementById('inputGoogleDocUrl');
      const inputAuto = document.getElementById('inputGoogleAutoSync');

      if (inputUrl) inputUrl.value = c.appsScriptUrl || '';
      if (inputSheet) inputSheet.value = c.sheetUrl || '';
      if (inputDoc) inputDoc.value = c.docUrl || '';
      if (inputAuto) inputAuto.checked = c.autoSync !== false;

      // Update Header quick button
      const headerSheetBtn = document.getElementById('headerBtnOpenSheet');
      if (headerSheetBtn) {
        if (c.sheetUrl) {
          headerSheetBtn.href = c.sheetUrl;
          headerSheetBtn.style.display = 'inline-flex';
        } else {
          headerSheetBtn.style.display = 'none';
        }
      }

      // Update Status Banner
      const statusBadge = document.getElementById('googleStatusBadge');
      const statusSub = document.getElementById('googleStatusSub');
      const btnOpenSheet = document.getElementById('btnOpenSheetDirect');
      const btnOpenDoc = document.getElementById('btnOpenDocDirect');

      if (c.appsScriptUrl && c.appsScriptUrl.trim()) {
        if (statusBadge) {
          statusBadge.className = 'badge-connected active';
          statusBadge.textContent = '🟢 Đang Hoạt Động';
        }
        if (statusSub) {
          const syncTime = c.lastSync ? formatDate(c.lastSync) : 'Chưa đồng bộ lần nào';
          statusSub.innerHTML = `Đã kết nối với Google Apps Script Web App. Lần đồng bộ gần nhất: <strong>${syncTime}</strong>`;
        }

        if (btnOpenSheet) {
          if (c.sheetUrl) {
            btnOpenSheet.href = c.sheetUrl;
            btnOpenSheet.style.display = 'inline-flex';
          } else {
            btnOpenSheet.style.display = 'none';
          }
        }

        if (btnOpenDoc) {
          if (c.docUrl) {
            const docHref = c.docUrl.startsWith('http') ? c.docUrl : `https://docs.google.com/document/d/${c.docUrl}/edit`;
            btnOpenDoc.href = docHref;
            btnOpenDoc.style.display = 'inline-flex';
          } else {
            btnOpenDoc.style.display = 'none';
          }
        }
      } else {
        if (statusBadge) {
          statusBadge.className = 'badge-connected inactive';
          statusBadge.textContent = '⚪ Chưa thiết lập';
        }
        if (statusSub) {
          statusSub.textContent = 'Dán URL Google Apps Script Web App bên dưới để kích hoạt kết nối cơ sở dữ liệu thời gian thực.';
        }
        if (btnOpenSheet) btnOpenSheet.style.display = 'none';
        if (btnOpenDoc) btnOpenDoc.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error loading Google config:', err);
  }
}

// Save Google Config
async function saveGoogleConfig(e) {
  if (e) e.preventDefault();

  const appsScriptUrl = (document.getElementById('inputGoogleAppsScriptUrl')?.value || '').trim();
  const sheetUrl = (document.getElementById('inputGoogleSheetUrl')?.value || '').trim();
  const docUrl = (document.getElementById('inputGoogleDocUrl')?.value || '').trim();
  const autoSync = document.getElementById('inputGoogleAutoSync')?.checked ?? true;

  try {
    const res = await fetch(`${API_BASE}/google/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appsScriptUrl, sheetUrl, docUrl, autoSync })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Đã lưu cấu hình Google Doc / Sheet thành công! 📑');
      loadGoogleConfig();
    } else {
      alert(json.message || 'Lỗi lưu cấu hình');
    }
  } catch (err) {
    console.error(err);
    alert('Không thể kết nối đến máy chủ!');
  }
}

// Test Connection
async function testGoogleConnection() {
  const btn = document.getElementById('btnTestGoogleConnection');
  const box = document.getElementById('googleFeedbackBox');
  const appsScriptUrl = (document.getElementById('inputGoogleAppsScriptUrl')?.value || '').trim();

  if (!appsScriptUrl) {
    alert('Vui lòng nhập URL Google Apps Script Web App trước khi kiểm tra!');
    return;
  }

  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Đang kiểm tra...';
  btn.disabled = true;

  if (box) {
    box.style.display = 'block';
    box.style.background = '#eaf2fd';
    box.style.color = '#1a56db';
    box.style.border = '1px solid #c3d9ff';
    box.textContent = 'Đang gửi tín hiệu kiểm tra kết nối tới Google Apps Script Web App...';
  }

  try {
    const res = await fetch(`${API_BASE}/google/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appsScriptUrl })
    });
    const json = await res.json();

    if (json.success) {
      if (box) {
        box.style.background = '#def7ec';
        box.style.color = '#03543f';
        box.style.border = '1px solid #bcf0da';
        box.innerHTML = `<strong>Thành công!</strong> ${json.message}<br><small>Thời gian phản hồi máy chủ Google: ${new Date().toLocaleTimeString('vi-VN')}</small>`;
      }
      showToast('Kết nối Google Sheet & Doc thành công! 🟢');
      loadGoogleConfig();
    } else {
      if (box) {
        box.style.background = '#fde8e8';
        box.style.color = '#9b1c1c';
        box.style.border = '1px solid #f8b4b4';
        box.innerHTML = `<strong>Lỗi kết nối:</strong> ${json.message || 'Không thể kết nối. Hãy kiểm tra quyền truy cập Web App là "Anyone" (Bất kỳ ai).'}`;
      }
    }
  } catch (err) {
    if (box) {
      box.style.background = '#fde8e8';
      box.style.color = '#9b1c1c';
      box.style.border = '1px solid #f8b4b4';
      box.textContent = `Lỗi mạng: ${err.message}`;
    }
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Push All Data to Google Sheet & Doc
async function pushAllToGoogle() {
  const btn = document.getElementById('btnPushAllToGoogle');
  const btnSyncGuests = document.getElementById('btnSyncGoogleGuests');
  const box = document.getElementById('googleFeedbackBox');

  if (!confirm('Bạn có chắc muốn đẩy toàn bộ danh sách khách mời (kèm link thiệp riêng) và dữ liệu mừng cưới lên Google Sheet & Doc?')) {
    return;
  }

  if (btn) {
    btn.innerHTML = '⏳ Đang đẩy dữ liệu...';
    btn.disabled = true;
  }
  if (btnSyncGuests) btnSyncGuests.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/google/push`, { method: 'POST' });
    const json = await res.json();

    if (json.success) {
      showToast('Đã đẩy toàn bộ khách mời và link thiệp lên Google Sheet thành công! 🚀');
      if (box) {
        box.style.display = 'block';
        box.style.background = '#def7ec';
        box.style.color = '#03543f';
        box.style.border = '1px solid #bcf0da';
        box.innerHTML = `<strong>Đồng bộ thành công!</strong> ${json.message}`;
      }
      loadGoogleConfig();
      loadGuests();
    } else {
      alert(json.message || 'Lỗi khi đẩy dữ liệu lên Google');
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra: ' + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = '⬆️ Đẩy Toàn Bộ Lên Google Sheet';
      btn.disabled = false;
    }
    if (btnSyncGuests) btnSyncGuests.disabled = false;
  }
}

// Pull All Guests from Google Sheet
async function pullAllFromGoogle() {
  const btn = document.getElementById('btnPullAllFromGoogle');
  const btnPullGuests = document.getElementById('btnPullGoogleGuests');
  const box = document.getElementById('googleFeedbackBox');

  if (btn) {
    btn.innerHTML = '⏳ Đang tải...';
    btn.disabled = true;
  }
  if (btnPullGuests) btnPullGuests.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/google/pull`, { method: 'POST' });
    const json = await res.json();

    if (json.success) {
      loadGuests();
      loadWishes();
      loadGifts();
      loadStats();
      loadGoogleConfig();
      showToast(json.message);
      if (box) {
        box.style.display = 'block';
        box.style.background = '#def7ec';
        box.style.color = '#03543f';
        box.style.border = '1px solid #bcf0da';
        box.innerHTML = `<strong>Thành công!</strong> ${json.message}`;
      }
    } else {
      alert(json.message || 'Lỗi khi tải dữ liệu từ Google');
    }
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra: ' + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = '⬇️ Tải Dữ Liệu Từ Google Về';
      btn.disabled = false;
    }
    if (btnPullGuests) btnPullGuests.disabled = false;
  }
}

// Load Real-time RSVP Attendance Confirmation Log
async function loadRsvpLog() {
  const tbody = document.getElementById('rsvpTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/rsvp`);
    const json = await res.json();
    if (json.success) {
      const rsvps = json.data || [];
      if (rsvps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888; padding: 24px;">Chưa có khách mời nào gửi phản hồi xác nhận tham dự</td></tr>`;
        return;
      }

      tbody.innerHTML = rsvps.map(r => {
        const time = formatDate(r.createdAt);
        const isAttending = r.willAttend === true || r.willAttend === 'yes';
        const statusBadge = isAttending 
          ? `<span class="badge-rsvp attending">✓ Sẽ tham dự</span>`
          : `<span class="badge-rsvp declined">✕ Không thể đến</span>`;

        let sideClass = 'trai';
        if (r.side === 'Nhà Gái') sideClass = 'gai';
        if (r.side === 'Bạn Chung') sideClass = 'chung';

        const origin = window.location.origin;
        const personalUrl = r.guestCode ? `${origin}/?to=${encodeURIComponent(r.guestCode)}` : '-';

        return `
          <tr>
            <td><small style="color: #666;">${time}</small></td>
            <td><strong>${r.name}</strong></td>
            <td><span class="badge-side ${sideClass}">${r.side || 'Nhà Trai'}</span></td>
            <td>${statusBadge}</td>
            <td><strong>${isAttending ? (r.guestCount || 1) : 0} người</strong></td>
            <td>
              ${r.guestCode ? `<a href="${personalUrl}" target="_blank" style="color: var(--adm-primary); font-size: 0.82rem; text-decoration: underline;">?to=${r.guestCode}</a>` : '<span style="color: #aaa;">Tự điền</span>'}
            </td>
            <td><span style="font-size: 0.82rem; color: #555;">${r.notes || 'Không có'}</span></td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading RSVP log:', err);
  }
}

// Copy Google Apps Script to Clipboard
async function copyGoogleScript() {
  const btn = document.getElementById('btnCopyGoogleScript');
  try {
    const res = await fetch('/google-apps-script.js');
    let scriptText = '';
    if (res.ok) {
      scriptText = await res.text();
    }

    if (!scriptText) {
      // Fallback excerpt
      scriptText = `// Vui lòng mở tệp google-apps-script.js trong thư mục dự án và sao chép toàn bộ nội dung.`;
    }

    await navigator.clipboard.writeText(scriptText);
    const original = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '✅ Đã Sao Chép Thành Công!';
    showToast('Đã sao chép toàn bộ mã Google Apps Script! Hãy dán vào Apps Script trên Google Sheet 📋');
    if (btn) setTimeout(() => btn.innerHTML = original, 2500);
  } catch (err) {
    showToast('Vui lòng mở tệp google-apps-script.js trong dự án để copy.');
  }
}

// Load Google Script Preview in Code Box
async function loadGoogleScriptPreview() {
  const pre = document.getElementById('googleScriptPreviewCode');
  if (!pre) return;
  try {
    const res = await fetch('/google-apps-script.js');
    if (res.ok) {
      const code = await res.text();
      pre.textContent = code.substring(0, 1500) + '\n\n... (Còn tiếp - Bấm nút "Sao chép toàn bộ mã Script" ở trên để lấy đầy đủ) ...';
    }
  } catch (err) {
    pre.textContent = '// Xem nội dung trong tệp google-apps-script.js';
  }
}

// =============================================================================
// 8. ADMIN AUTHENTICATION & SECURITY CONTROLLER
// =============================================================================

const AUTH_KEY = 'wedding_admin_session_token';

function isUserAuthenticated() {
  return Boolean(sessionStorage.getItem(AUTH_KEY));
}

function showLoginGate() {
  const gate = document.getElementById('adminLoginGate');
  if (gate) {
    gate.classList.remove('hidden');
    const pwdInput = document.getElementById('adminPasswordInput');
    if (pwdInput) {
      pwdInput.value = '';
      setTimeout(() => pwdInput.focus(), 250);
    }
  }
}

function hideLoginGate() {
  const gate = document.getElementById('adminLoginGate');
  if (gate) gate.classList.add('hidden');
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const pwdInput = document.getElementById('adminPasswordInput');
  const alertBox = document.getElementById('loginErrorAlert');
  const btn = document.getElementById('btnAdminLogin');
  const password = pwdInput ? pwdInput.value.trim() : '';

  if (!password) {
    if (alertBox) {
      alertBox.textContent = 'Vui lòng nhập mật khẩu quản trị!';
      alertBox.style.display = 'block';
    }
    return;
  }

  const originalBtn = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '<span>Đang xác thực...</span>';
    btn.disabled = true;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const json = await res.json();

    if (json.success && json.token) {
      sessionStorage.setItem(AUTH_KEY, json.token);
      if (alertBox) alertBox.style.display = 'none';
      hideLoginGate();
      showToast('Đăng nhập thành công! Chúc dâu rể ngày vui trọn vẹn 💍');
      initDashboardData();
    } else {
      if (alertBox) {
        alertBox.textContent = json.message || 'Mật khẩu không chính xác!';
        alertBox.style.display = 'block';
        alertBox.style.animation = 'none';
        void alertBox.offsetWidth; // Force CSS reflow to re-trigger shake
        alertBox.style.animation = 'shake 0.4s ease-in-out';
      }
      if (pwdInput) {
        pwdInput.select();
        pwdInput.focus();
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.textContent = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra server!';
      alertBox.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.innerHTML = originalBtn;
      btn.disabled = false;
    }
  }
}

function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất khỏi hệ thống quản trị?')) {
    sessionStorage.removeItem(AUTH_KEY);
    showLoginGate();
    showToast('Đã đăng xuất an toàn khỏi hệ thống!');
  }
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('adminPasswordInput');
  const btn = document.getElementById('btnTogglePassword');
  if (!pwdInput) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    pwdInput.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

async function handleChangePassword(e) {
  if (e) e.preventDefault();
  const oldPassword = document.getElementById('inputOldPassword')?.value || '';
  const newPassword = document.getElementById('inputNewPassword')?.value || '';
  const confirmPassword = document.getElementById('inputConfirmPassword')?.value || '';

  if (newPassword !== confirmPassword) {
    alert('Mật khẩu mới và mật khẩu xác nhận không trùng khớp!');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Đã cập nhật mật khẩu quản trị mới thành công! 🔐');
      document.getElementById('changePasswordForm')?.reset();
    } else {
      alert(json.message || 'Lỗi khi đổi mật khẩu!');
    }
  } catch (err) {
    console.error(err);
    alert('Không thể kết nối đến máy chủ!');
  }
}

function initDashboardData() {
  loadStats();
  loadSettings();
  loadGoogleConfig();
  loadGoogleScriptPreview();
}

// Initialization & Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Auth listeners
  document.getElementById('adminLoginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('btnAdminLogout')?.addEventListener('click', handleLogout);
  document.getElementById('btnTogglePassword')?.addEventListener('click', togglePasswordVisibility);
  document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);

  // Google config listeners
  document.getElementById('googleConfigForm')?.addEventListener('submit', saveGoogleConfig);
  document.getElementById('btnTestGoogleConnection')?.addEventListener('click', testGoogleConnection);
  document.getElementById('btnPushAllToGoogle')?.addEventListener('click', pushAllToGoogle);
  document.getElementById('btnPullAllFromGoogle')?.addEventListener('click', pullAllFromGoogle);
  document.getElementById('btnRefreshRsvpLog')?.addEventListener('click', loadRsvpLog);
  document.getElementById('btnCopyGoogleScript')?.addEventListener('click', copyGoogleScript);

  // Guests tab google sync buttons
  document.getElementById('btnSyncGoogleGuests')?.addEventListener('click', pushAllToGoogle);
  document.getElementById('btnPullGoogleGuests')?.addEventListener('click', pullAllFromGoogle);

  // Verify Session Token
  const token = sessionStorage.getItem(AUTH_KEY);
  if (token) {
    fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }).then(res => res.json()).then(json => {
      if (json.success && json.valid) {
        hideLoginGate();
        initDashboardData();
      } else {
        sessionStorage.removeItem(AUTH_KEY);
        showLoginGate();
      }
    }).catch(() => {
      hideLoginGate();
      initDashboardData();
    });
  } else {
    showLoginGate();
  }
});

