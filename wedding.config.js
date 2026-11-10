/**
 * ============================================================================
 *  CẤU HÌNH THIỆP CƯỚI — Lưu Viết Trung & Đoàn Phương Nhi
 * ============================================================================
 *  Đây là file DUY NHẤT cần sửa để thay nội dung, ảnh, nhạc và màu sắc.
 *  Sửa xong chạy `npm run dev` để xem, `npm run build` để xuất bản.
 *
 *  - Chú thích `// TODO` = thông tin thật cần bạn điền/xác nhận (ngày giờ, địa điểm, ngân hàng…).
 *  - Chú thích `// (gợi ý)` = câu chữ đã viết sẵn cho hợp thiệp, sửa tùy ý.
 *  - Đường dẫn ảnh/nhạc tính từ thư mục `public/`
 *    (vd "photos/hero.jpg" nghĩa là file `public/photos/hero.jpg`).
 *  - Ảnh có dạng "photos/placeholder/<tên>.svg" là ảnh giữ chỗ do Vite tự
 *    sinh theo màu theme — thay bằng ảnh thật khi có.
 *  - Ngày theo định dạng "YYYY-MM-DD", giờ "HH:mm" (giờ Việt Nam, UTC+7).
 * ============================================================================
 */
export default {
  // ---------------------------------------------------------------------------
  // 0. CHỌN PHƯƠNG ÁN GIAO DIỆN (cho `npm run dev` và `npm run build`)
  //   "a": Song Hỷ Xanh — album lật trang 3D, lời chúc bay, nhạc chạy lời (file này)
  //   "b": dựa trên dewanakl/undangan — cấu hình ở huong-b/wedding.config.js
  //   Cũng chọn được khi chạy: npm run build -- b   hoặc   npm run dev:b
  // ---------------------------------------------------------------------------
  phuongAn: "a",

  // ---------------------------------------------------------------------------
  // 1. THÔNG TIN TRANG (dùng cho <title> và ảnh xem trước khi gửi qua Zalo/Facebook)
  // ---------------------------------------------------------------------------
  site: {
    domain: "https://TODO.pages.dev", // TODO: tên miền thật, không có dấu "/" ở cuối
    title: "Thiệp cưới Trung & Nhi",
    description:
      "Trung & Nhi trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng mình. Mở thiệp để xem thời gian, địa điểm và gửi lời chúc nhé!", // (gợi ý)
    ogImage: "photos/share-1200x630.jpg", // tạo bởi `npm run photos` từ photos.share
  },

  // ---------------------------------------------------------------------------
  // 2. GIAO DIỆN
  // ---------------------------------------------------------------------------
  theme: {
    // Bộ màu có sẵn: "luc-bao" (xanh lục bảo) | "xo-thom" (xanh xô thơm)
    //                | "navy" (xanh than) | "xanh-bui" (xanh bụi)
    preset: "luc-bao",
    // Ghi đè từng màu của preset (bỏ trống hoặc xóa dòng để dùng màu của preset).
    // Các màu phụ (đậm, nhạt, viền, chữ phụ...) được tự tính lúc build.
    colors: {
      // primary: "#1f5c45",   // màu chính: nút, tiêu đề nhấn
      // accent: "#b8975a",    // màu nhấn: viền vàng, hoa văn, tim
      // background: "#f7f1e5",// màu nền trang
      // surface: "#fffdf8",   // màu nền thẻ / khung
      // text: "#1c2a24",      // màu chữ
    },
    fonts: {
      display: "Playfair Display", // font tiêu đề (Google Fonts)
      body: "Be Vietnam Pro", // font nội dung
      script: "Great Vibes", // font chữ viết tay
    },
    ornament: "song-hy", // "song-hy" (chữ 囍) | "monogram" (chữ cái đầu "T · N") | "none"
  },

  // ---------------------------------------------------------------------------
  // 3. CÔ DÂU & CHÚ RỂ
  // ---------------------------------------------------------------------------
  couple: {
    groom: {
      fullName: "Lưu Viết Trung",
      displayName: "Viết Trung", // tên hiện ở phần giới thiệu, báo hỷ, liên hệ
      shortName: "Trung",
      role: "Chú rể", // dòng nhỏ dưới tên ở khối báo hỷ (thiệp gửi bạn bè nên dùng "Chú rể"; có thể ghi "Trưởng nam"…)
      portrait: "groom", // ảnh cắt từ img3831 (xem photos.crops)
      bio: "Chàng trai hiền lành, chân thành, ít nói nhưng luôn chu đáo. Với Trung, Nhi là người khiến những ngày bình thường trở nên đặc biệt.", // (gợi ý)
      phone: "0334 395 967",
      father: "Ông Lưu Văn Phú",
      mother: "Bà Phạm Thị Lục",
      address: "Thôn Phúc Hòa, Xã Thác Bà, Tỉnh Lào Cai",
      familyPhone: "0346 409 672", // (tùy chọn) SĐT đại diện nhà trai, để trống thì không hiện
    },
    bride: {
      fullName: "Đoàn Phương Nhi",
      displayName: "Phương Nhi", // tên hiện ở phần giới thiệu, báo hỷ, liên hệ
      shortName: "Nhi",
      role: "Cô dâu", // dòng nhỏ dưới tên ở khối báo hỷ (có thể ghi "Trưởng nữ"…)
      portrait: "bride", // ảnh cắt từ img3799 (xem photos.crops)
      bio: "Cô gái dịu dàng, hay cười và luôn quan tâm mọi người xung quanh. Với Nhi, Trung là bến bình yên để trở về sau mỗi ngày dài.", // (gợi ý)
      phone: "0345 512 667",
      father: "Ông Đoàn Văn Hưng",
      mother: "Bà Đoàn Thị Phượng",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
      familyPhone: "0345 512 667", // TODO: đang trùng số cô dâu — điền số bố/mẹ nếu muốn
    },
  },

  // ---------------------------------------------------------------------------
  // 4. CÁC SỰ KIỆN — tổ chức tại tư gia hai nhà (không ở nhà hàng)
  //  audience: ai được thấy sự kiện này.
  //   - "nha-trai" / "nha-gai" / "ban-chung": khớp cột "side" của khách trong Google Sheet
  //   - "public": người mở link KHÔNG có mã khách (?to=) hoặc mã không có trong Sheet
  //   - "all": mọi người
  //   - tên nhóm bất kỳ (vd "gia-dinh"): khớp cột "groups" của khách
  //  main: true → sự kiện dùng cho ngày lớn, lịch và đếm ngược (lấy sự kiện main đầu tiên khách thấy).
  //  lunar: ghi sẵn bằng chữ. Đổi ngày thì tính lại bằng: npm run lunar -- 2026-12-12
  //  Trên thiệp, sự kiện tự sắp theo thời gian.
  // ---------------------------------------------------------------------------
  //  Lễ Ăn Hỏi và Đón dâu ở nhà gái: khách nhà gái, và người trong đoàn nhà trai đi đón dâu —
  //  ghi "doan-nha-trai" vào cột groups của những người này trong Google Sheet.
  events: [
    // ----- Ngày 12/12/2026 (04/11 âm) — tại nhà gái -----
    {
      id: "tiec-nha-gai",
      name: "Tiệc cưới nhà gái",
      main: true,
      date: "2026-12-12",
      time: "16:00", // (gợi ý) chiều ngày 4 — TODO: xác nhận giờ
      endTime: "19:00",
      lunar: "Nhằm ngày 04 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà gái",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Th%C3%B4n%20K%E1%BB%B3%20S%C6%A1n%2C%20X%C3%A3%20%C4%90%E1%BA%A1i%20S%C6%A1n%2C%20TP.%20H%E1%BA%A3i%20Ph%C3%B2ng", // TODO: link ghim đúng cổng nhà
      audience: ["nha-gai", "ban-chung", "public"],
    },
    {
      id: "an-hoi",
      name: "Lễ Ăn Hỏi",
      date: "2026-12-12",
      time: "22:30", // (gợi ý) làm trong đêm — TODO: xác nhận giờ
      endTime: "23:30",
      lunar: "Nhằm ngày 04 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà gái",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Th%C3%B4n%20K%E1%BB%B3%20S%C6%A1n%2C%20X%C3%A3%20%C4%90%E1%BA%A1i%20S%C6%A1n%2C%20TP.%20H%E1%BA%A3i%20Ph%C3%B2ng", // TODO: link ghim đúng cổng nhà
      audience: ["nha-gai", "doan-nha-trai", "public"],
    },
    // ----- Ngày 13/12/2026 (05/11 âm) -----
    {
      id: "le-vu-quy",
      name: "Lễ Vu Quy · Đón dâu",
      date: "2026-12-13",
      time: "00:30", // (gợi ý) ngay sau lễ ăn hỏi — TODO: xác nhận giờ
      endTime: "01:00",
      lunar: "Nhằm ngày 05 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà gái",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Th%C3%B4n%20K%E1%BB%B3%20S%C6%A1n%2C%20X%C3%A3%20%C4%90%E1%BA%A1i%20S%C6%A1n%2C%20TP.%20H%E1%BA%A3i%20Ph%C3%B2ng", // TODO: link ghim đúng cổng nhà
      note: "Khoảng 01:00 đoàn xuất phát, về tới nhà trai khoảng 05:45 sáng.",
      audience: ["nha-gai", "doan-nha-trai", "public"],
    },
    {
      id: "le-thanh-hon",
      name: "Lễ Thành Hôn",
      date: "2026-12-13",
      time: "10:00",
      endTime: "10:45", // (gợi ý)
      lunar: "Nhằm ngày 05 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà trai",
      address: "Thôn Phúc Hòa, Xã Thác Bà, Tỉnh Lào Cai",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Th%C3%B4n%20Ph%C3%BAc%20H%C3%B2a%2C%20X%C3%A3%20Th%C3%A1c%20B%C3%A0%2C%20L%C3%A0o%20Cai", // TODO: link ghim đúng cổng nhà
      audience: ["nha-trai", "public"],
    },
    {
      id: "tiec-nha-trai",
      name: "Tiệc cưới nhà trai",
      main: true,
      date: "2026-12-13",
      time: "11:00", // (gợi ý) sáng ngày 5, sau lễ thành hôn — TODO: xác nhận giờ
      endTime: "14:00",
      lunar: "Nhằm ngày 05 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà trai",
      address: "Thôn Phúc Hòa, Xã Thác Bà, Tỉnh Lào Cai",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Th%C3%B4n%20Ph%C3%BAc%20H%C3%B2a%2C%20X%C3%A3%20Th%C3%A1c%20B%C3%A0%2C%20L%C3%A0o%20Cai", // TODO: link ghim đúng cổng nhà
      audience: ["nha-trai", "ban-chung", "public"],
    },
  ],

  // ---------------------------------------------------------------------------
  // 5. LỊCH TRÌNH NGÀY CƯỚI
  //  icon: "heart" | "rings" | "camera" | "cheers" | "car" | "music" | "home"
  // ---------------------------------------------------------------------------
  // Lịch trình hai ngày cưới (day: ngày dương, hiện dưới giờ). TODO: chỉnh giờ khi chốt
  schedule: [
    { day: "12/12", time: "16:00", title: "Tiệc nhà gái", icon: "cheers" },
    { day: "12/12", time: "22:30", title: "Lễ ăn hỏi", icon: "heart" },
    { day: "13/12", time: "00:30", title: "Đón dâu", icon: "car" },
    { day: "13/12", time: "05:45", title: "Về nhà trai", icon: "home" },
    { day: "13/12", time: "10:00", title: "Lễ thành hôn", icon: "rings" },
    { day: "13/12", time: "11:00", title: "Tiệc nhà trai", icon: "cheers" },
  ],

  // ---------------------------------------------------------------------------
  // 6. MỪNG CƯỚI (chuyển khoản)
  //  bankBin: mã BIN ngân hàng (Vietcombank 970436, Techcombank 970407,
  //           BIDV 970418, VietinBank 970415, MB 970422, ACB 970416, TPBank 970423,
  //           VPBank 970432, Agribank 970405 — tra thêm tại vietqr.io).
  //  qrImage: đường dẫn ảnh QR có sẵn (ghi đè QR tự sinh), để null nếu không có.
  // ---------------------------------------------------------------------------
  gifts: {
    collapsed: true, // true = thu gọn, khách bấm mới mở
    accounts: [
      {
        family: "nha-trai",
        owner: "Chú rể",
        bankBin: "970436", // TODO
        bankName: "Vietcombank", // TODO
        accountNo: "0000000000", // TODO
        accountName: "LUU VIET TRUNG", // TODO: tên chủ TK in hoa không dấu
        qrImage: null,
      },
      {
        family: "nha-gai",
        owner: "Cô dâu",
        bankBin: "970436", // TODO
        bankName: "Vietcombank", // TODO
        accountNo: "0000000000", // TODO
        accountName: "DOAN PHUONG NHI", // TODO
        qrImage: null,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. ẢNH (ảnh thật đặt trong public/photos/)
  // ---------------------------------------------------------------------------
  photos: {
    // Thư mục ảnh gốc trên máy (chỉ dùng khi chạy `npm run photos`, KHÔNG đưa lên git/web).
    // Có thể thay bằng biến môi trường PHOTO_SOURCE.
    source: "C:/Users/Trung lv/Pictures/me/dam-ngo",
    // Ảnh ghi bằng mã lấy từ tên file: IMG_3788.jpg → "img3788", IMG_3808_1.jpg → "img3808-1".
    // Chỉ những ảnh ghi trong file này mới được xuất (xem photos-contact-sheet.html khi chạy `npm run dev`).
    share: "img3782", // ảnh xem trước 1200x630 khi gửi link (có biển tên hai bạn)
    hero: "img3788", // ảnh bìa (khung dọc 4:5): hai bạn tựa vào nhau
    statement: "img3777", // ảnh dưới lời mời
    middle: [
      "img3818", // sau phần sự kiện: cầu thang, đen trắng
      "img3692", // sau phần đếm ngược: hai bạn ở cổng
    ],
    ending: "img3702", // ảnh kết: nắm tay đi về phía máy (chữ cảm ơn nằm giữa ảnh)
    // Ảnh cắt khung dọc 4:5 từ ảnh chụp chung (x, y, width: tỉ lệ 0–1 theo chiều rộng/cao ảnh gốc)
    crops: [
      { id: "groom", from: "img3831", x: 0.222, y: 0.19, width: 0.258, aspect: 0.8 }, // chú rể, không lấy biển/cô dâu
      { id: "bride", from: "img3799", x: 0.49, y: 0.26, width: 0.4, aspect: 0.8 }, // cô dâu với bó hoa
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. ALBUM LẬT TRANG 3D
  //  Mỗi "leaf" là một tờ: mặt trước (trang phải) và mặt sau (trang trái khi lật).
  //  Ảnh nên cùng tỉ lệ 5:7 (vd 1200x1680). frontHardcover: tờ bìa trước,
  //  backHardcover: tờ bìa sau.
  // ---------------------------------------------------------------------------
  album: {
    title: "Ngày dạm ngõ · 31.10.2026", // dòng tiêu đề khi xem album toàn màn hình
    // Theo thứ tự câu chuyện. Ảnh ngang tự đặt trọn trên nền giấy ("contain");
    // ghi frontFit/backFit: "cover" hoặc "contain" để đổi cho từng trang.
    // Chú thích (frontAlt/backAlt) là gợi ý, hiện ở thanh tiêu đề khi lật album
    leaves: [
      { front: "img3667", back: "img3739", frontAlt: "Ngày dạm ngõ · 31.10.2026", backAlt: "Hai họ trao lễ", frontHardcover: true },
      { front: "img3692", back: "img3698", frontAlt: "Đón nhau trước ngõ", backAlt: "Bên cánh cổng nhà" },
      { front: "img3702", back: "img3769", frontAlt: "Tay trong tay", backAlt: "Bên hiên nhà" },
      { front: "img3707", back: "img3808-1", frontAlt: "Bên hiên nhà", backAlt: "Thắp hương gia tiên" },
      { front: "img3772-1", back: "img3780", frontAlt: "Giữa vườn xanh", backAlt: "Giữa vườn xanh" },
      { front: "img3782", back: "img3788", frontAlt: "Phương Nhi ♥ Viết Trung", backAlt: "Tựa vào nhau" },
      { front: "img3792", back: "img3799", frontAlt: "Ánh mắt trao nhau", backAlt: "Nàng và bó hoa" },
      { front: "img3823", back: "img3826", frontAlt: "Dịu dàng", backAlt: "Dịu dàng" },
      { front: "img3831", back: "img3818", frontAlt: "Hai đứa mình", backAlt: "Lối nhỏ về nhà" },
      { front: "img3854", back: "img3846", frontAlt: "Phút riêng tư", backAlt: "Nàng ngồi đợi" },
      { front: "img3896", back: "img3901", frontAlt: "Trước gương", backAlt: "Trước gương" },
      { front: "img3912", back: "img3872", frontAlt: "Bên bàn trà", backAlt: "Hai gia đình", backHardcover: true },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. NHẠC NỀN + LỜI CHẠY
  //  lyrics: file .lrc (định dạng [mm:ss.xx] Lời bài hát), để "" nếu không có.
  // ---------------------------------------------------------------------------
  music: {
    src: "music/le-duong.mp3", // TODO: THAY BÀI — "Lễ Đường" là bài có bản quyền, chỉ dùng tạm
    title: "Lễ Đường", // TODO: tên bài mới
    artist: "Kai Đinh", // TODO: ca sĩ
    lyrics: "music/le-duong.lrc", // TODO: file lời .lrc của bài mới (hoặc "" nếu không có)
  },

  // ---------------------------------------------------------------------------
  // 10. CÂU CHỮ
  // ---------------------------------------------------------------------------
  texts: {
    // (gợi ý) — sửa tùy ý, xuống dòng bằng \n
    quote: "Từ một lời hẹn ngày dạm ngõ, thành một đời thương nhau.",
    invitation:
      "Trân trọng kính mời bạn đến dự\nlễ thành hôn của chúng tôi\nvà cùng chung vui, chia sẻ niềm hạnh phúc này.",
    thankYou:
      "Cảm ơn bạn đã dành thời gian mở tấm thiệp nhỏ này.\nSự hiện diện và lời chúc của bạn\nlà món quà ý nghĩa nhất với Trung & Nhi.",
  },

  // ---------------------------------------------------------------------------
  // 11. CÁC PHẦN HIỂN THỊ (theo thứ tự). Xóa tên khỏi danh sách để ẩn phần đó.
  //  cover: bìa thư | hero: ảnh bìa | invitation: lời mời + bố mẹ hai bên
  //  couple: chân dung | events: sự kiện | schedule: lịch trình
  //  countdown: lịch + đếm ngược | album | music: lời bài hát
  //  gifts: mừng cưới | rsvp: xác nhận tham dự | wishes: lời chúc bay
  //  ending: ảnh kết
  // ---------------------------------------------------------------------------
  sections: [
    "cover",
    "hero",
    "invitation",
    "couple",
    "events",
    "schedule",
    "countdown",
    "album",
    "music",
    "gifts",
    "rsvp",
    "wishes",
    "ending",
  ],

  // ---------------------------------------------------------------------------
  // 12. BACKEND (Google Apps Script) — xem README để cài đặt.
  //  appsScriptUrl để trống = chế độ demo (không gọi mạng, lưu tạm trong trình duyệt).
  // ---------------------------------------------------------------------------
  backend: {
    appsScriptUrl: "", // TODO: dán URL Web App dạng https://script.google.com/macros/s/.../exec
    rsvpDeadline: "2026-12-02", // (gợi ý) 10 ngày trước tiệc cưới
    maxGuestsPerInvite: 4, // số người tối đa một thiệp được đăng ký
  },
};
