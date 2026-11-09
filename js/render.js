/**
 * Đổ nội dung từ wedding.config.js vào trang.
 * Mọi chuỗi do người dùng/khách nhập đều chèn bằng textContent (không innerHTML).
 */
// Danh sách ảnh đã xử lý bởi `npm run photos` (có thể chưa tồn tại → {})
const manifestModules = import.meta.glob('./photo-manifest.json', { eager: true });
const PHOTO_MANIFEST = (Object.values(manifestModules)[0] || {}).default || { photos: {} };

/**
 * Ảnh trong config có thể là id (vd "p05", do `npm run photos` tạo) hoặc đường dẫn file.
 * Trả về { src, srcset, full, thumb } — srcset cho trình duyệt tự chọn cỡ vừa màn hình.
 */
export function photo(ref, displaySize = 1600) {
  const p = PHOTO_MANIFEST.photos?.[ref];
  if (!p) return { src: ref || '', srcset: '', full: ref || '', thumb: ref || '', orientation: '' };
  const entries = Object.entries(p.sizes || {}).sort((a, b) => a[0] - b[0]);
  return {
    src: `photos/${ref}-${displaySize}.webp`,
    srcset: entries.map(([s, [w]]) => `photos/${ref}-${s}.webp ${w}w`).join(', '),
    full: `photos/${ref}-${entries.length ? entries[entries.length - 1][0] : displaySize}.webp`,
    thumb: `photos/${ref}-${entries.length ? entries[0][0] : displaySize}.webp`,
    orientation: p.orientation || '',
  };
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setText(sel, value) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (el) el.textContent = value ?? '';
}
const SIZES_FULL = '(max-width: 500px) 100vw, 500px';
function setImg(sel, ref, alt = '', sizes = SIZES_FULL) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el) return;
  const ph = photo(ref);
  if (ph.srcset) {
    el.sizes = sizes;
    el.srcset = ph.srcset;
  }
  if (ph.src) el.src = ph.src;
  el.alt = alt;
  // Khung ảnh theo hướng ảnh (dọc/ngang) để không cắt mất người
  if (ph.orientation && el.parentElement) {
    el.parentElement.classList.remove('is-portrait', 'is-landscape', 'is-square');
    el.parentElement.classList.add(`is-${ph.orientation}`);
  }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
/** Nhiều dòng (ngăn bằng \n) → các thẻ <p>. */
function setLines(container, text, pClass) {
  if (!container) return;
  container.replaceChildren(...String(text || '').split('\n').filter(Boolean).map((line) => el('p', pClass, line)));
}
const safeUrl = (u) => (/^(https?:|tel:|mailto:)/i.test(String(u || '')) ? String(u) : '#');

// ---------------------------------------------------------------------------
// Ngày giờ (giờ Việt Nam)
// ---------------------------------------------------------------------------
const DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export function parseDate(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return { y, m: mo, d, dow, dowText: DOW[dow] };
}
const pad = (n) => String(n).padStart(2, '0');
export const dotDate = (p) => (p ? `${pad(p.d)}.${pad(p.m)}.${p.y}` : '');
export function eventDateTime(ev) {
  const time = /^\d{1,2}:\d{2}$/.test(ev?.time || '') ? ev.time.padStart(5, '0') : '12:00';
  const d = new Date(`${ev?.date}T${time}:00+07:00`);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Tiện ích chuỗi
// ---------------------------------------------------------------------------
export function stripDiacritics(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
export const slugify = (s) =>
  stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const coupleNames = (config) => `${config.couple.groom.shortName} & ${config.couple.bride.shortName}`;

// ---------------------------------------------------------------------------
// Khách mời & sự kiện
// ---------------------------------------------------------------------------
/** Tên đầy đủ để xưng hô, vd "Bác Hùng". */
export function guestTitle(guest) {
  if (!guest) return '';
  return [guest.xungHo, guest.name].filter(Boolean).join(' ').trim();
}

/**
 * Sự kiện khách được thấy: audience có "all", hoặc khớp side / groups của khách.
 * Người mở link không có mã khách (hoặc mã không tồn tại) mang nhãn "public".
 */
export function visibleEvents(config, guest) {
  const tags = new Set(['all']);
  if (!guest) tags.add('public');
  if (guest) {
    if (guest.side) tags.add(slugify(guest.side));
    (Array.isArray(guest.groups) ? guest.groups : String(guest.groups || '').split(','))
      .map((g) => slugify(g))
      .filter(Boolean)
      .forEach((g) => tags.add(g));
  }
  return (config.events || []).filter((ev) => {
    const aud = ev.audience && ev.audience.length ? ev.audience : ['all'];
    return aud.some((a) => tags.has(slugify(a)));
  });
}

export function mainEvent(config, guest) {
  const list = visibleEvents(config, guest);
  return list.find((e) => e.main) || list[0] || (config.events || []).find((e) => e.main) || (config.events || [])[0] || null;
}

// ---------------------------------------------------------------------------
// Ẩn/hiện & sắp xếp các phần theo `sections`
// ---------------------------------------------------------------------------
export function applySections(config) {
  const enabled = new Set(config.sections || []);
  const container = $('#mainScrollContainer');

  $$('[data-section]').forEach((node) => {
    const key = node.dataset.section;
    if (key === 'photo') return;
    if (!enabled.has(key)) node.hidden = true;
  });
  if (!enabled.has('cover')) {
    const cover = $('#weddingIntroCover');
    if (cover) cover.style.display = 'none';
  }

  // Ảnh giữa: hiện nếu có ảnh và phần đứng trước nó đang bật
  $$('[data-section="photo"]').forEach((node) => {
    const src = (config.photos?.middle || [])[Number(node.dataset.photoIndex)];
    if (!src || !enabled.has(node.dataset.after)) {
      node.hidden = true;
      return;
    }
    setImg(node.querySelector('img'), src, `Ảnh cưới ${coupleNames(config)}`);
  });

  // Sắp thứ tự trong vùng cuộn đúng như mảng sections
  if (container) {
    (config.sections || []).forEach((key) => {
      $$(`:scope > [data-section="${key}"]`, container).forEach((node) => {
        container.appendChild(node);
        $$(`:scope > [data-section="photo"][data-after="${key}"]`, container).forEach((p) => container.appendChild(p));
      });
    });
  }

  if (!config.music?.src) {
    ['#musicSection', '#audio-control-wrapper'].forEach((s) => {
      const n = $(s);
      if (n) n.hidden = true;
    });
  }
}

// ---------------------------------------------------------------------------
// Nội dung cố định (không phụ thuộc khách)
// ---------------------------------------------------------------------------
const SCHEDULE_ICONS = {
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  rings: '<circle cx="8" cy="14" r="5"/><circle cx="16" cy="14" r="5"/><path d="M12 5l1.5 3h-3z"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  cheers: '<path d="M8 22h8M12 15v7M17 3l-5 7-5-7h10z"/>',
  car: '<path d="M5 17h14M3 13l2-6h14l2 6v4H3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  home: '<path d="M3 11l9-8 9 8v10H3z"/><path d="M9 21v-6h6v6"/>',
};

function ornamentText(config) {
  const o = config.theme?.ornament || 'song-hy';
  if (o === 'none') return '';
  if (o === 'monogram') {
    const g = (config.couple.groom.shortName || '').charAt(0);
    const b = (config.couple.bride.shortName || '').charAt(0);
    return `${g} · ${b}`;
  }
  return '囍';
}

export function renderStatic(config) {
  const { groom, bride } = config.couple;
  const names = coupleNames(config);

  // Hoa văn bìa
  const orn = ornamentText(config);
  if (!orn) document.body.classList.add('orn-none');
  $$('.ambient-xi').forEach((n) => (n.textContent = orn));
  const seal = $('#sealText');
  if (seal) {
    seal.textContent = orn;
    if (orn.length > 1) seal.setAttribute('font-size', '22');
  }

  // Tên
  setText('#introGroomName', groom.shortName);
  setText('#introBrideName', bride.shortName);
  setText('#heroGroomName', groom.shortName);
  setText('#heroBrideName', bride.shortName);
  setText('#profileGroomName', groom.fullName);
  setText('#profileBrideName', bride.fullName);
  setText('#groomRole', (groom.role || '').toUpperCase());
  setText('#brideRole', (bride.role || '').toUpperCase());
  setText('#groomProfileName', groom.fullName);
  setText('#brideProfileName', bride.fullName);
  setText('#groomBio', groom.bio);
  setText('#brideBio', bride.bio);
  setText('#endingNames', names);
  setText('#cdCoupleNames', `${groom.shortName} và ${bride.shortName}`);
  setText('#theaterEyebrow', `${(config.album?.title || 'Album ảnh cưới').toUpperCase()} · ${names.toUpperCase()}`);

  // Bố mẹ
  setText('#familyGroomFather', groom.father);
  setText('#familyGroomMother', groom.mother);
  setText('#familyGroomAddress', groom.address);
  setText('#familyBrideFather', bride.father);
  setText('#familyBrideMother', bride.mother);
  setText('#familyBrideAddress', bride.address);

  // Ảnh
  const p = config.photos || {};
  setImg('#heroImg', p.hero, names);
  setImg('#statementImg', p.statement, names);
  setImg('#endingImg', p.ending, names);
  setImg('#groomPortrait', groom.portrait, `Chú rể ${groom.fullName}`, '(max-width: 500px) 46vw, 230px');
  setImg('#bridePortrait', bride.portrait, `Cô dâu ${bride.fullName}`, '(max-width: 500px) 46vw, 230px');

  // Câu chữ
  const t = config.texts || {};
  setLines($('#statementText'), t.invitation);
  setText('#coupleQuote', t.quote);
  if (!t.quote) $('#coupleQuote')?.setAttribute('hidden', '');
  setLines($('#thankYouText'), t.thankYou, 'stt-ending-p');

  // Lịch trình
  const row = $('#timelineRow');
  if (row) {
    row.replaceChildren(
      ...(config.schedule || []).map((s) => {
        const step = el('div', 'stt-timeline-step');
        const icon = el('div', 'stt-step-icon');
        // Icon lấy từ bảng SVG cố định ở trên (không phải chuỗi người dùng)
        icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${SCHEDULE_ICONS[s.icon] || SCHEDULE_ICONS.heart}</svg>`;
        step.append(icon, el('span', 'stt-step-time', s.time), el('span', 'stt-step-title', s.title));
        return step;
      })
    );
  }

  // Nhạc
  const m = config.music || {};
  setText('#musicSectionTitle', m.title);
  setText('#songTitle', m.title);
  setText('#songArtist', [m.artist, 'Lời tự động chạy'].filter(Boolean).join(' · '));
  setText('#autoplayPromptText', `Chạm màn hình để nghe bài hát ${m.title || ''}`.trim());

  // RSVP
  const deadline = parseDate(config.backend?.rsvpDeadline);
  setText(
    '#rsvpDesc',
    `Vui lòng xác nhận${deadline ? ` trước ngày ${dotDate(deadline)}` : ' sớm'} để ${names} chuẩn bị đón tiếp chu đáo nhất.`
  );
  if (deadline) setText('#rsvpDeadlineText', `Xin vui lòng phản hồi trước ngày ${dotDate(deadline)} để chuẩn bị chu đáo`);
  const max = Math.max(1, Math.min(10, Number(config.backend?.maxGuestsPerInvite) || 4));
  const gc = $('#guestCount');
  if (gc) gc.max = String(max);

  // Liên hệ
  const contacts = [
    { name: groom.fullName, role: 'Chú rể', phone: groom.phone },
    { name: bride.fullName, role: 'Cô dâu', phone: bride.phone },
    { name: groom.father || 'Nhà trai', role: 'Đại diện nhà trai', phone: groom.familyPhone },
    { name: bride.father || 'Nhà gái', role: 'Đại diện nhà gái', phone: bride.familyPhone },
  ].filter((c) => c.phone);
  const list = $('#contactList');
  if (list) {
    list.replaceChildren(
      ...contacts.map((c) => {
        const item = el('div', 'stt-contact-item');
        const info = el('div', 'stt-contact-info');
        info.append(el('strong', null, c.name), el('span', null, `${c.role} · ${c.phone}`));
        const a = el('a', 'stt-call-btn', 'Gọi ngay');
        a.href = `tel:${String(c.phone).replace(/[^\d+]/g, '')}`;
        item.append(info, a);
        return item;
      })
    );
  }
  if (!contacts.length) $('#btnOpenContactModal')?.setAttribute('hidden', '');
}

// ---------------------------------------------------------------------------
// Mừng cưới
// ---------------------------------------------------------------------------
const FAMILY_LABEL = { 'nha-trai': 'Nhà trai', 'nha-gai': 'Nhà gái' };

export function vietQrUrl(acc, addInfo) {
  if (acc.qrImage) return acc.qrImage;
  const info = stripDiacritics(addInfo).replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50).trim();
  const q = new URLSearchParams({ addInfo: info, accountName: acc.accountName || '' });
  return `https://img.vietqr.io/image/${encodeURIComponent(acc.bankBin)}-${encodeURIComponent(acc.accountNo)}-compact2.png?${q}`;
}

export function renderGifts(config, guest) {
  const wrap = $('#giftGroups');
  if (!wrap) return;
  const accounts = config.gifts?.accounts || [];
  const collapsed = config.gifts?.collapsed !== false;
  const { groom, bride } = config.couple;
  const addInfo = `Mung cuoi ${groom.shortName} ${bride.shortName}${guest ? ' ' + guestTitle(guest) : ''}`;

  const families = [...new Set(accounts.map((a) => a.family || 'nha-trai'))];
  wrap.replaceChildren(
    ...families.map((fam) => {
      const group = el('div', 'stt-acc-group');
      const toggle = el('button', `stt-acc-toggle${collapsed ? '' : ' active'}`);
      toggle.type = 'button';
      toggle.append(el('span', null, FAMILY_LABEL[fam] || fam));
      toggle.insertAdjacentHTML(
        'beforeend',
        '<svg class="stt-acc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'
      );
      const body = el('div', `stt-acc-body${collapsed ? '' : ' show'}`);
      accounts
        .filter((a) => (a.family || 'nha-trai') === fam)
        .forEach((a) => {
          const card = el('div', 'stt-acc-card');
          const meta = el('div', 'stt-acc-meta');
          meta.append(
            el('span', 'stt-bank-name', [a.owner, a.bankName].filter(Boolean).join(' · ')),
            el('strong', 'stt-acc-num', a.accountNo),
            el('span', 'stt-acc-holder', a.accountName)
          );
          const qrBox = el("div", "stt-qr-box");
          const img = el('img');
          img.loading = 'lazy';
          img.alt = `Mã QR chuyển khoản ${a.owner || ''}`.trim();
          img.src = vietQrUrl(a, addInfo);
          qrBox.append(img);
          const copy = el('button', 'stt-copy-btn', 'Sao chép số tài khoản');
          copy.type = 'button';
          copy.dataset.acc = a.accountNo;
          copy.dataset.owner = a.owner || '';
          card.append(meta, qrBox, copy);
          body.append(card);
        });
      group.append(toggle, body);
      return group;
    })
  );
}

// ---------------------------------------------------------------------------
// Phần phụ thuộc khách: lời chào, sự kiện, ngày chính
// ---------------------------------------------------------------------------
export function renderEvents(config, guest) {
  // Hiển thị theo thời gian diễn ra (không phụ thuộc thứ tự trong config)
  const events = visibleEvents(config, guest)
    .slice()
    .sort((x, y) => (eventDateTime(x)?.getTime() ?? 0) - (eventDateTime(y)?.getTime() ?? 0));
  const main = mainEvent(config, guest);
  const mp = parseDate(main?.date);

  setText('#introWeddingDate', mp ? `${mp.d} tháng ${mp.m}, ${mp.y}` : '');
  setText('#heroCalloutDate', dotDate(mp));
  setText('#bigDow', mp ? mp.dowText.toUpperCase() : '');
  setText('#bigDay', mp ? String(mp.d) : '');
  setText('#bigMonth', mp ? `THÁNG ${mp.m}` : '');
  setText('#bigYear', mp ? String(mp.y) : '');
  setText('#ceremonyLunarDisplay', main?.lunar ? `(${main.lunar})` : '');

  const wrap = $('#eventCards');
  if (wrap) {
    wrap.replaceChildren(
      ...events.map((ev) => {
        const p = parseDate(ev.date);
        const card = el('div', 'stt-loc-card');
        const time = [ev.time, ev.endTime].filter(Boolean).join(' — ');
        const when = [time, p ? `${p.dowText}, ${dotDate(p)}` : ''].filter(Boolean).join(' · ');
        card.append(el('h3', 'stt-loc-name', ev.name), el('p', 'stt-loc-time', `Thời gian: ${when}`));
        card.append(el('p', 'stt-loc-addr', [ev.venue, ev.address].filter(Boolean).join(' — ')));
        if (ev.lunar && ev.date !== main?.date) card.append(el('p', 'stt-loc-note', `(${ev.lunar})`));
        if (ev.mapsUrl) {
          const a = el('a', 'stt-loc-btn', `Chỉ đường — ${ev.name}`);
          a.href = safeUrl(ev.mapsUrl);
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          card.append(a);
        }
        return card;
      })
    );
  }
  return main;
}

export function renderGuest(config, guest) {
  const title = guestTitle(guest);
  const greet = $('#introSubGreeting');
  if (greet) {
    if (title) {
      greet.replaceChildren(document.createTextNode('Kính mời '), el('strong', 'intro-guest-name', title));
    } else {
      greet.textContent = 'Trân trọng kính mời';
    }
  }
  if (!guest) return;

  const box = $('#letterPersonalizedBox');
  if (box) box.style.display = 'block';
  setText('#letterGuestName', title);

  const nameInput = $('#guestName');
  if (nameInput && !nameInput.value) nameInput.value = guest.name || '';
  const side = slugify(guest.side);
  const radio = $(`input[name="guestSide"][value="${side}"]`);
  if (radio) radio.checked = true;
  const badge = $('#rsvpPersonalizedBadge');
  if (badge) badge.style.display = 'block';
  setText('#rsvpGuestTitle', title);

  const sender = $('#wishSender');
  if (sender && !sender.value) sender.value = title;
}

// ---------------------------------------------------------------------------
// Lịch tháng & đếm ngược
// ---------------------------------------------------------------------------
export function renderCalendar(ev) {
  const p = parseDate(ev?.date);
  const matrix = $('#calDaysMatrix');
  if (!p || !matrix) return;
  setText('#calHeaderDateDisplay', dotDate(p));
  setText('#calHeaderSubDisplay', `${p.dowText}${ev.time ? `, ${ev.time}` : ''}`);

  const total = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const offset = new Date(Date.UTC(p.y, p.m - 1, 1)).getUTCDay();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(el('span', 'cal-cell other-month'));
  for (let d = 1; d <= total; d++) {
    const c = el('span', d === p.d ? 'cal-cell is-wedding-day' : 'cal-cell', String(d));
    if (d === p.d) c.title = 'Ngày cưới';
    cells.push(c);
  }
  matrix.replaceChildren(...cells);
}

let countdownTimer = null;
export function startCountdown(ev) {
  if (countdownTimer) clearInterval(countdownTimer);
  const target = eventDateTime(ev);
  const ids = ['daysVal', 'hoursVal', 'minutesVal', 'secondsVal'].map((id) => document.getElementById(id));
  const rem = document.getElementById('cdRemainingDays');
  if (!target || ids.some((n) => !n)) return;
  const tick = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    const s = Math.floor(diff / 1000);
    const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
    parts.forEach((v, i) => (ids[i].textContent = pad(v)));
    if (rem) rem.textContent = String(parts[0]);
    if (diff <= 0 && countdownTimer) clearInterval(countdownTimer);
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

// ---------------------------------------------------------------------------
// Album: dựng danh sách trang đôi và trang đơn từ config.album.leaves
// ---------------------------------------------------------------------------
export function buildAlbum(leavesCfg = []) {
  // Mỗi mặt trang: src (hiển thị), srcset (theo màn hình), full (bản 2560 cho phóng to), thumb
  const leaves = leavesCfg
    .filter((l) => l && l.front && l.back)
    .map((l) => {
      const f = photo(l.front);
      const b = photo(l.back);
      // Ảnh ngang trên trang dọc: mặc định "contain" (đặt trên nền giấy, không cắt mặt); ghi đè bằng frontFit/backFit
      const fit = (ph, own) => own || (ph.orientation === 'landscape' ? 'contain' : 'cover');
      return {
        ...l,
        front: f.src, frontSrcset: f.srcset, frontFull: f.full, frontThumb: f.thumb, frontFit: fit(f, l.frontFit),
        back: b.src, backSrcset: b.srcset, backFull: b.full, backThumb: b.thumb, backFit: fit(b, l.backFit),
      };
    });
  const n = leaves.length;
  const inner = Math.max(0, 2 * n - 2);
  const spreads = [];
  for (let i = 0; i <= n; i++) {
    const right = i < n ? leaves[i] : null;
    const left = i > 0 ? leaves[i - 1] : null;
    let title = (right && right.frontAlt) || (left && left.backAlt) || '';
    let counter;
    if (i === 0) counter = `Bìa trước · ${Math.max(0, n - 1)} trang đôi`;
    else if (i === n) counter = 'Bìa sau · Trọn vẹn yêu thương';
    else counter = `Trang ${pad(2 * i - 1)}–${pad(2 * i)} / ${pad(inner)}`;
    if (i === n) title = (left && left.backAlt) || title;
    spreads.push({
      label: i === 0 ? 'Bìa' : i === n ? 'Kết' : pad(i),
      title,
      counter,
      leftThumb: left ? left.backThumb : null,
      rightThumb: right ? right.frontThumb : null,
      zoomIdx: i === 0 ? 0 : 2 * i - 1,
    });
  }
  const pages = leaves.flatMap((l) => [
    { src: l.frontFull, caption: l.frontAlt || '' },
    { src: l.backFull, caption: l.backAlt || '' },
  ]);
  return { leaves, spreads, pages };
}
