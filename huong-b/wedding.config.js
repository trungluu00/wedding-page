// =============================================================================
//  CẤU HÌNH THIỆP CƯỚI — Lưu Viết Trung & Đoàn Phương Nhi (hướng B)
//  Mọi nội dung, ảnh, màu sắc của thiệp đều sửa ở file này.
//  Khung (schema) dùng chung với hướng A: đừng đổi tên khóa, chỉ đổi giá trị.
//  Các dòng có "TODO" là thông tin thật cần điền/xác nhận; "(gợi ý)" là câu chữ soạn sẵn, sửa tùy ý.
//  Thông tin thật (tên, bố mẹ, địa chỉ, SĐT, ngày cưới) đồng bộ với wedding.config.js ở thư mục gốc
//  (phương án A) — khi sửa một bên, nhớ sửa bên kia.
//  Sửa xong chạy `npm run build` (hoặc để `npm run dev` tự tải lại).
// =============================================================================

export default {
  // --- Thông tin trang (dùng cho tiêu đề tab và ảnh xem trước khi gửi link qua Zalo/Facebook) ---
  site: {
    domain: "https://TODO.pages.dev", // TODO: địa chỉ thật sau khi deploy (không có "/" cuối)
    title: "Thiệp cưới Trung & Nhi",
    description: "Trung & Nhi trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng mình. Mở thiệp để xem thời gian, địa điểm và gửi lời chúc nhé!", // (gợi ý)
    ogImage: "photos/share-1200x630.jpg", // ảnh JPG 1200x630 khi chia sẻ link; sinh từ photos.shareFrom bởi `npm run photos`
  },

  // --- Giao diện ---
  theme: {
    // Bảng màu có sẵn: "luc-bao" (xanh lục bảo, mặc định) | "xo-thom" (xanh xô thơm) | "navy" (xanh than) | "xanh-bui" (xanh bụi)
    preset: "luc-bao",
    // Để null = dùng màu của preset. Điền mã màu (#rrggbb) để ghi đè từng màu.
    colors: {
      primary: null, // màu chủ đạo (nút, tiêu đề)
      accent: null, // màu nhấn (vàng đồng, đường viền trang trí)
      background: null, // nền trang
      surface: null, // nền thẻ/khối
      text: null, // màu chữ
    },
    // Font Google Fonts, bắt buộc có hỗ trợ tiếng Việt.
    fonts: { display: "Playfair Display", body: "Be Vietnam Pro", script: "Great Vibes" },
    ornament: "song-hy", // "song-hy" (chữ Hỷ) | "monogram" (chữ cái đầu T & N) | "none"
  },

  // --- Cô dâu, chú rể ---
  couple: {
    groom: {
      fullName: "Lưu Viết Trung",
      displayName: "Viết Trung", // tên hiện ở phần giới thiệu, báo hỷ, liên hệ
      shortName: "Trung",
      portrait: "p38-chu-re", // cắt từ p38 (chưa có ảnh chú rể chụp riêng)
      bio: "Chàng trai hiền lành, chân thành, ít nói nhưng luôn chu đáo. Với Trung, Nhi là người khiến những ngày bình thường trở nên đặc biệt.", // (gợi ý)
      phone: "0334 395 967",
      father: "Ông Lưu Văn Phú",
      mother: "Bà Phạm Thị Lục",
      address: "Thôn Phúc Hòa, Xã Thác Bà, Tỉnh Lào Cai",
    },
    bride: {
      fullName: "Đoàn Phương Nhi",
      displayName: "Phương Nhi", // tên hiện ở phần giới thiệu, báo hỷ, liên hệ
      shortName: "Nhi",
      portrait: "p32", // cô dâu bên bảng tên lễ dạm ngõ
      bio: "Cô gái dịu dàng, hay cười và luôn quan tâm mọi người xung quanh. Với Nhi, Trung là bến bình yên để trở về sau mỗi ngày dài.", // (gợi ý)
      phone: "0345 512 667",
      father: "Ông Đoàn Văn Hưng",
      mother: "Bà Đoàn Thị Phượng",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
    },
  },

  // --- Các sự kiện — tổ chức tại tư gia hai nhà (không ở nhà hàng) ---
  // date: "YYYY-MM-DD", time: "HH:mm" (giờ Việt Nam). lunar: ghi sẵn dạng chữ
  //   (tính bằng lệnh ở thư mục gốc: npm run lunar -- 2026-12-12).
  // audience: ai thấy sự kiện này. "all" = mọi khách; "public" = người mở link không có mã khách;
  //   "nha-trai" / "nha-gai" / "ban-chung" / tên nhóm khác khớp với cột side/groups trong Google Sheet.
  events: [
    // ----- Ngày 12/12/2026 (04/11 âm) — tiệc nhà gái -----
    {
      id: "tiec-nha-gai",
      name: "Tiệc cưới nhà gái",
      main: true,
      date: "2026-12-12",
      time: "16:00", // (gợi ý) chiều ngày 4 — TODO: xác nhận giờ
      endTime: "19:00",
      lunar: "Nhằm ngày 04 tháng 11 năm Bính Ngọ",
      venue: "Chùa Phăn",
      address: "Xã Đại Sơn, TP. Hải Phòng",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Ch%C3%B9a%20Ph%C4%83n%2C%20%C4%90%E1%BA%A1i%20S%C6%A1n%2C%20H%E1%BA%A3i%20Ph%C3%B2ng", // chỉ đường tới Chùa Phăn (V9M4+99, Đại Sơn) — đã thử mở đúng địa điểm
      audience: ["nha-gai", "ban-chung", "public"],
    },
    // ----- Ngày 13/12/2026 (05/11 âm) -----
    {
      id: "le-thanh-hon",
      name: "Lễ Thành Hôn",
      date: "2026-12-13",
      time: "10:00",
      endTime: "10:45", // (gợi ý)
      lunar: "Nhằm ngày 05 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà trai",
      address: "Thôn Phúc Hòa, Xã Thác Bà, Tỉnh Lào Cai",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Th%C3%B4n%20Ph%C3%BAc%20H%C3%B2a%2C%20X%C3%A3%20Th%C3%A1c%20B%C3%A0%2C%20L%C3%A0o%20Cai", // chỉ đường tới thôn Phúc Hòa (Hán Đà, Thác Bà) — TODO: thay bằng tọa độ cổng nhà để chính xác hơn
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
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Th%C3%B4n%20Ph%C3%BAc%20H%C3%B2a%2C%20X%C3%A3%20Th%C3%A1c%20B%C3%A0%2C%20L%C3%A0o%20Cai", // chỉ đường tới thôn Phúc Hòa (Hán Đà, Thác Bà) — TODO: thay bằng tọa độ cổng nhà để chính xác hơn
      audience: ["nha-trai", "ban-chung", "public"],
    },
  ],

  // --- Lịch trình ngày cưới (icon: tên icon Font Awesome 6, vd "fa-ring") ---
  // Lịch trình hai ngày cưới (day: ngày dương, hiện dưới giờ). TODO: chỉnh giờ khi chốt
  schedule: [
    { day: "12/12", time: "16:00", title: "Tiệc nhà gái", icon: "fa-utensils" },
    { day: "13/12", time: "10:00", title: "Lễ thành hôn", icon: "fa-ring" },
    { day: "13/12", time: "11:00", title: "Tiệc nhà trai", icon: "fa-champagne-glasses" },
  ],

  // --- Mừng cưới (QR chuyển khoản qua VietQR) ---
  // bankBin: mã BIN ngân hàng 6 số (vd Vietcombank 970436, Techcombank 970407, MB 970422, VPBank 970432).
  // qrImage: null = tự tạo QR từ img.vietqr.io; hoặc đường dẫn ảnh QR có sẵn, vd "photos/qr-trung.png".
  gifts: {
    collapsed: true, // true = thu gọn, khách bấm mới hiện
    accounts: [
      {
        family: "nha-trai",
        owner: "Chú rể Lưu Viết Trung",
        bankBin: "970436", // TODO
        bankName: "Vietcombank", // TODO
        accountNo: "0000000000", // TODO
        accountName: "LUU VIET TRUNG", // TODO: tên chủ tài khoản, IN HOA không dấu
        qrImage: null,
      },
      {
        family: "nha-gai",
        owner: "Cô dâu Đoàn Phương Nhi",
        bankBin: "970436", // TODO
        bankName: "Vietcombank", // TODO
        accountNo: "0000000000", // TODO
        accountName: "DOAN PHUONG NHI", // TODO
        qrImage: null,
      },
    ],
  },

  // --- Ảnh (lễ dạm ngõ 31.10.2026) ---
  // Ghi MÃ ẢNH pNN (mã cố định theo photos/manifest.json). Chỉ ảnh được dùng ở đây mới được
  // `npm run photos` xuất ra photos/w/ (đủ cỡ 2560/1600/900/400); ảnh bỏ dùng bị xóa khỏi photos/w/.
  // Xem ảnh nào đang dùng ở đâu + danh sách ảnh gốc chưa dùng: photos-contact-sheet.html.
  // Vẫn có thể ghi đường dẫn thường, vd "photos/abc.jpg".
  photos: {
    // Thư mục ảnh gốc trên máy (chỉ dùng cho `npm run photos`; ảnh gốc không deploy, không commit).
    // Có thể thay bằng biến môi trường PHOTO_SOURCE.
    source: "C:/Users/Trung lv/Pictures/me/dam-ngo",
    shareFrom: "p27", // ảnh chia sẻ Zalo/Facebook 1200x630 (photos/share-1200x630.jpg)
    sharePosition: "center", // "center" = cắt giữa | "attention" = tự tìm vùng nổi bật
    cover: "p29", // ảnh trong khung vòm ở bìa thư: hai bạn tựa vào nhau
    hero: "p25", // ảnh lớn đầu thiệp sau khi mở
    statement: "p16", // ảnh nền mờ phía sau lời mời: nắm tay đi tới
    middle: ["p11", "p34"], // ảnh chèn giữa các phần: ở cổng nhà, cầu thang (đen trắng)
    ending: "p26", // ảnh cuối thiệp
    // Ảnh cắt từ một vùng của ảnh gốc (left/top/width/height theo tỉ lệ 0..1 của ảnh gốc đã xoay đúng chiều).
    crops: {
      "p38-chu-re": { from: "p38", left: 0.2, top: 0.205, width: 0.27, height: 0.506 }, // chú rể bên trái p38, khung dọc 4:5
    },
  },

  // --- Album (hướng B hiển thị thành lưới ảnh theo thứ tự front rồi back của từng "lá") ---
  album: {
    kicker: "Khoảnh khắc", // dòng chữ nhỏ trên tiêu đề album
    title: "Ngày dạm ngõ · 31.10.2026",
    leaves: [
      { front: "p03", back: "p01", frontAlt: "Đoàn nhà trai sang nhà gái", backAlt: "Trao lễ dạm ngõ" },
      { front: "p11", back: "p14", frontAlt: "Hai bạn ở cổng nhà", backAlt: "Hai bạn ở cổng nhà" },
      { front: "p16", back: "p02", frontAlt: "Nắm tay đi tới", backAlt: "Bên bảng tên lễ dạm ngõ" },
      { front: "p17", back: "p33", frontAlt: "Trong nhà gái", backAlt: "Thắp hương bàn thờ gia tiên" },
      { front: "p23", back: "p26", frontAlt: "Hai bạn bên bảng tên", backAlt: "Hai bạn bên bảng tên" },
      { front: "p27", back: "p29", frontAlt: "Hai bạn bên bảng tên", backAlt: "Hai bạn tựa vào nhau" },
      { front: "p30", back: "p32", frontAlt: "Hai bạn bên bảng tên", backAlt: "Cô dâu bên bảng tên" },
      { front: "p36", back: "p37", frontAlt: "Cô dâu cầm hoa", backAlt: "Cô dâu cầm hoa" },
      { front: "p38", back: "p34", frontAlt: "Chú rể và cô dâu bên bảng tên", backAlt: "Khoảnh khắc trên cầu thang" },
      { front: "p41", back: "p40", frontAlt: "Chú rể bên cô dâu", backAlt: "Cô dâu" },
      { front: "p49", back: "p50", frontAlt: "Cô dâu bên bàn trà", backAlt: "Cô dâu soi gương" },
      { front: "p54", back: "p42", frontAlt: "Cô dâu bên bàn trà", backAlt: "Hai gia đình" },
    ],
  },

  // --- Nhạc nền (bật khi khách bấm "Mở thiệp"). Để src rỗng = không có nhạc ---
  music: {
    src: "", // TODO: vd "music/bai-hat.mp3" (nên < 3 MB, có bản quyền sử dụng)
    title: "", // TODO
    artist: "", // TODO
    lyrics: null,
  },

  // --- Lời văn. {khach} sẽ được thay bằng cách xưng hô với khách, vd "Anh Tuấn" hoặc "Bạn" (khi không có mã khách) ---
  texts: {
    quote: "Từ một lời hẹn ngày dạm ngõ, thành một đời thương nhau.", // (gợi ý)
    invitation:
      "Trân trọng kính mời {khach} tới dự lễ thành hôn của chúng tôi và cùng chung vui trong ngày hạnh phúc này.", // (gợi ý)
    thankYou:
      "Sự hiện diện của {khach} là niềm vui lớn nhất với chúng tôi. Cảm ơn thật nhiều!", // (gợi ý)
  },

  // --- Thứ tự các phần trên thiệp. Bỏ tên nào khỏi danh sách thì phần đó bị ẩn ---
  sections: ["cover", "hero", "invitation", "couple", "events", "schedule", "countdown", "album", "music", "gifts", "rsvp", "wishes", "ending"],

  // --- Kết nối Google Sheet (Apps Script do hướng A viết) ---
  backend: {
    appsScriptUrl: "", // TODO: dán URL Web App Apps Script (…/exec). Để rỗng = chế độ demo, dữ liệu lưu trong trình duyệt.
    rsvpDeadline: "2026-12-02", // (gợi ý) 10 ngày trước tiệc cưới
    maxGuestsPerInvite: 4,
  },
};
