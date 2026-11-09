/**
 * ============================================================================
 *  CẤU HÌNH THIỆP CƯỚI — Lưu Viết Trung & Đoàn Phương Nhi
 * ============================================================================
 *  Đây là file DUY NHẤT cần sửa để thay nội dung, ảnh, nhạc và màu sắc.
 *  Sửa xong chạy `npm run dev` để xem, `npm run build` để xuất bản.
 *
 *  - Mọi chỗ có chú thích `// TODO` là giá trị giữ chỗ, cần điền thật.
 *  - Đường dẫn ảnh/nhạc tính từ thư mục `public/`
 *    (vd "photos/hero.jpg" nghĩa là file `public/photos/hero.jpg`).
 *  - Ảnh có dạng "photos/placeholder/<tên>.svg" là ảnh giữ chỗ do Vite tự
 *    sinh theo màu theme — thay bằng ảnh thật khi có.
 *  - Ngày theo định dạng "YYYY-MM-DD", giờ "HH:mm" (giờ Việt Nam, UTC+7).
 * ============================================================================
 */
export default {
  // ---------------------------------------------------------------------------
  // 1. THÔNG TIN TRANG (dùng cho <title> và ảnh xem trước khi gửi qua Zalo/Facebook)
  // ---------------------------------------------------------------------------
  site: {
    domain: "https://TODO.pages.dev", // TODO: tên miền thật, không có dấu "/" ở cuối
    title: "Thiệp cưới Trung & Nhi",
    description:
      "Trân trọng kính mời bạn đến chung vui trong ngày cưới của Trung & Nhi.", // TODO: chỉnh câu mô tả nếu muốn
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
      shortName: "Trung",
      role: "Trưởng nam", // TODO: Trưởng nam / Thứ nam / Út nam...
      portrait: "groom", // ảnh cắt từ img3831 (xem photos.crops)
      bio: "Chú rể — TODO: vài dòng giới thiệu ngắn.", // TODO
      phone: "0334 395 967", // TODO
      father: "Ông Lưu Văn Phú", // TODO
      mother: "Bà Phạm Thị Lục", // TODO
      address: "Thôn Phúc Hòa, Xã Thác Bà, Tỉnh Lào Cai", // TODO
      familyPhone: "0346 409 672", // (tùy chọn) SĐT đại diện nhà trai, để trống thì không hiện
    },
    bride: {
      fullName: "Đoàn Phương Nhi",
      shortName: "Nhi",
      role: "Trưởng nữ", // TODO: Trưởng nữ / Thứ nữ / Út nữ...
      portrait: "bride", // ảnh cắt từ img3799 (xem photos.crops)
      bio: "Cô dâu — TODO: vài dòng giới thiệu ngắn.", // TODO
      phone: "0345 ", // TODO
      father: "Ông Đoàn Văn TODO", // TODO
      mother: "Bà Trần Thị TODO", // TODO
      address: "TODO: xã/phường, tỉnh", // TODO
      familyPhone: "", // (tùy chọn) SĐT đại diện nhà gái
    },
  },

  // ---------------------------------------------------------------------------
  // 4. CÁC SỰ KIỆN
  //  audience: ai được thấy sự kiện này.
  //   - "all": mọi người (kể cả khi mở link không có ?to=)
  //   - "nha-trai" / "nha-gai": khớp cột "side" của khách trong Google Sheet
  //   - tên nhóm bất kỳ (vd "gia-dinh"): khớp cột "groups" của khách
  //  main: true → sự kiện dùng cho đếm ngược, lịch và ngày lớn trên thiệp
  //  (nếu khách không thấy sự kiện main thì dùng sự kiện đầu tiên họ thấy).
  //  lunar: ghi sẵn bằng chữ (không tự tính).
  // ---------------------------------------------------------------------------
  events: [
    {
      id: "le-vu-quy",
      name: "Lễ Vu Quy",
      date: "2027-01-16", // TODO
      time: "08:00", // TODO
      endTime: "09:30", // TODO (tùy chọn)
      lunar: "Nhằm ngày 09 tháng 12 năm Bính Ngọ", // TODO: kiểm tra lại âm lịch
      venue: "Tư gia nhà gái", // TODO
      address: "TODO: số nhà, thôn/đường, xã/phường, tỉnh", // TODO
      mapsUrl: "https://maps.google.com/?q=TODO", // TODO: link Google Maps
      audience: ["nha-gai"],
    },
    {
      id: "le-thanh-hon",
      name: "Lễ Thành Hôn",
      date: "2027-01-16", // TODO
      time: "10:00", // TODO
      endTime: "11:00", // TODO
      lunar: "Nhằm ngày 09 tháng 12 năm Bính Ngọ", // TODO
      venue: "Tư gia nhà trai", // TODO
      address: "TODO: số nhà, thôn/đường, xã/phường, tỉnh", // TODO
      mapsUrl: "https://maps.google.com/?q=TODO", // TODO
      audience: ["nha-trai"],
    },
    {
      id: "tiec-cuoi",
      name: "Tiệc cưới",
      main: true,
      date: "2027-01-16", // TODO
      time: "11:30", // TODO
      endTime: "14:00", // TODO
      lunar: "Nhằm ngày 09 tháng 12 năm Bính Ngọ", // TODO
      venue: "Nhà hàng TODO", // TODO
      address: "TODO: địa chỉ nhà hàng", // TODO
      mapsUrl: "https://maps.google.com/?q=TODO", // TODO
      audience: ["all"],
    },
  ],

  // ---------------------------------------------------------------------------
  // 5. LỊCH TRÌNH NGÀY CƯỚI
  //  icon: "heart" | "rings" | "camera" | "cheers" | "car" | "music" | "home"
  // ---------------------------------------------------------------------------
  schedule: [
    { time: "11:00", title: "Đón khách", icon: "heart" }, // TODO
    { time: "11:30", title: "Làm lễ", icon: "rings" }, // TODO
    { time: "11:45", title: "Chụp ảnh lưu niệm", icon: "camera" }, // TODO
    { time: "12:00", title: "Khai tiệc", icon: "cheers" }, // TODO
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
    leaves: [
      { front: "img3667", back: "img3739", frontAlt: "Ngày dạm ngõ · 31.10.2026", backAlt: "Trao lễ", frontHardcover: true },
      { front: "img3692", back: "img3698", frontAlt: "Trước cổng nhà", backAlt: "Trước cổng nhà" },
      { front: "img3702", back: "img3769", frontAlt: "Tay trong tay", backAlt: "Bên hiên nhà" },
      { front: "img3707", back: "img3808-1", frontAlt: "Bên hiên nhà", backAlt: "Thắp hương gia tiên" },
      { front: "img3772-1", back: "img3780", frontAlt: "Trong vườn", backAlt: "Trong vườn" },
      { front: "img3782", back: "img3788", frontAlt: "Lễ dạm ngõ", backAlt: "Bên nhau" },
      { front: "img3792", back: "img3799", frontAlt: "Bên nhau", backAlt: "Nàng" },
      { front: "img3823", back: "img3826", frontAlt: "Nàng", backAlt: "Nàng" },
      { front: "img3831", back: "img3818", frontAlt: "Hai đứa mình", backAlt: "Khoảnh khắc" },
      { front: "img3854", back: "img3846", frontAlt: "Phút riêng tư", backAlt: "Nàng" },
      { front: "img3896", back: "img3901", frontAlt: "Nàng", backAlt: "Nàng" },
      { front: "img3912", back: "img3872", frontAlt: "Nàng", backAlt: "Hai gia đình", backHardcover: true },
    ],
  },



  // ---------------------------------------------------------------------------
  // 9. NHẠC NỀN + LỜI CHẠY
  //  lyrics: file .lrc (định dạng [mm:ss.xx] Lời bài hát), để "" nếu không có.
  // ---------------------------------------------------------------------------
  music: {
    src: "music/le-duong.mp3", // TODO: THAY BÀI — "Lễ Đường" là bài có bản quyền, chỉ dùng tạm
    title: "Lễ Đường", // TODO
    artist: "Kai Đinh", // TODO
    lyrics: "music/le-duong.lrc", // TODO
  },

  // ---------------------------------------------------------------------------
  // 10. CÂU CHỮ
  // ---------------------------------------------------------------------------
  texts: {
    quote: "Hai trái tim, một lời hứa, trọn một đời.", // TODO
    invitation:
      "Trân trọng kính mời quý khách đến dự\nlễ thành hôn của hai con\nvà cùng chia sẻ niềm hạnh phúc trọn vẹn nhất.",
    thankYou:
      "Cảm ơn bạn đã ghé thăm tấm thiệp nhỏ này.\nSự hiện diện và lời chúc của bạn\nlà món quà ý nghĩa nhất với chúng mình.",
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
    rsvpDeadline: "2027-01-06", // TODO: hạn xác nhận tham dự
    maxGuestsPerInvite: 4, // số người tối đa một thiệp được đăng ký
  },
};
