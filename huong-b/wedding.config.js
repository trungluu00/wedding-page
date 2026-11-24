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
    domain: "https://trung-nhi.vercel.app", // Vercel (không có "/" cuối)
    title: "Thiệp cưới Trung & Nhi",
    description: "Trung & Nhi trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng tôi. Mở thiệp để xem thời gian, địa điểm và gửi lời chúc nhé!", // (gợi ý)
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
      portrait: "p04-chu-re", // cắt từ ảnh cưới DUN00081 (nhìn thẳng, trong vườn)
      bio: "Chàng trai hiền lành, chân thành, ít nói nhưng luôn chu đáo. Với Trung, Nhi là người khiến những ngày bình thường trở nên đặc biệt.", // (gợi ý)
      phone: "0334 395 967",
      father: "Ông Lưu Văn Phú",
      mother: "Bà Phạm Thị Lục",
      address: "Thôn Phúc Hoà, Xã Thác Bà, Tỉnh Lào Cai",
    },
    bride: {
      fullName: "Đoàn Phương Nhi",
      displayName: "Phương Nhi", // tên hiện ở phần giới thiệu, báo hỷ, liên hệ
      shortName: "Nhi",
      portrait: "p04-co-dau", // cắt từ ảnh cưới DUN00081 (nhìn thẳng, trong vườn)
      bio: "Cô gái dịu dàng, hay cười và luôn quan tâm mọi người xung quanh. Với Nhi, Trung là bến bình yên để trở về sau mỗi ngày dài.", // (gợi ý)
      phone: "0345 512 667",
      father: "Ông Đoàn Văn Hưng",
      mother: "Bà Đoàn Thị Phượng",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
    },
  },

  // ---------------------------------------------------------------------------
  // 4. CÁC SỰ KIỆN — theo thiệp in (tổ chức tại tư gia hai nhà)
  //  audience: ai được thấy sự kiện này.
  //   - "nha-trai" / "nha-gai" / "ban-chung": khớp cột "side" của khách trong Google Sheet,
  //     hoặc link theo nhà: ?ben=nha-trai / ?ben=nha-gai
  //   - "public": người mở link không có mã khách và không có ?ben=
  //   - "all": mọi người; tên nhóm khác (vd "gia-dinh") khớp cột "groups"
  //  main: true → sự kiện dùng cho ngày lớn, lịch và đếm ngược.
  //  time: để "" nếu chưa chốt giờ (thiệp in đang để trống giờ bữa cơm) — thiệp chỉ hiện ngày.
  //  lunar: ghi sẵn bằng chữ (npm run lunar -- 2026-12-12). Trên thiệp, sự kiện tự sắp theo thời gian.
  // ---------------------------------------------------------------------------
  events: [
    // ----- Thứ Bảy 12/12/2026 (04/11 âm): bữa cơm thân mật tại hai nhà -----
    {
      id: "tiec-nha-trai",
      name: "Bữa cơm thân mật · Nhà trai",
      main: true,
      date: "2026-12-12",
      time: "", // TODO: giờ bữa cơm (thiệp in để trống)
      lunar: "Tức ngày 04 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà trai",
      address: "Thôn Phúc Hoà, Xã Thác Bà, Tỉnh Lào Cai",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Th%C3%B4n%20Ph%C3%BAc%20H%C3%B2a%2C%20X%C3%A3%20Th%C3%A1c%20B%C3%A0%2C%20L%C3%A0o%20Cai", // chỉ đường theo địa chỉ trên thiệp in
      audience: ["nha-trai", "ban-chung", "public"],
    },
    {
      id: "tiec-nha-gai",
      name: "Bữa cơm thân mật · Nhà gái",
      main: true,
      date: "2026-12-12",
      time: "", // TODO: giờ bữa cơm (thiệp in để trống)
      lunar: "Tức ngày 04 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà gái",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Ch%C3%B9a%20Ph%C4%83n%2C%20%C4%90%E1%BA%A1i%20S%C6%A1n%2C%20H%E1%BA%A3i%20Ph%C3%B2ng", // chỉ đường tới Chùa Phăn (mốc gần nhà gái)
      audience: ["nha-gai", "ban-chung", "public"],
    },
    // ----- Chủ nhật 13/12/2026 (05/11 âm) -----
    {
      id: "le-vu-quy",
      name: "Lễ Vu Quy",
      date: "2026-12-13",
      time: "06:00",
      lunar: "Tức ngày 05 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà gái",
      address: "Thôn Kỳ Sơn, Xã Đại Sơn, TP. Hải Phòng",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Ch%C3%B9a%20Ph%C4%83n%2C%20%C4%90%E1%BA%A1i%20S%C6%A1n%2C%20H%E1%BA%A3i%20Ph%C3%B2ng",
      audience: ["nha-gai", "public"],
    },
    {
      id: "le-thanh-hon",
      name: "Lễ Thành Hôn",
      date: "2026-12-13",
      time: "10:00",
      lunar: "Tức ngày 05 tháng 11 năm Bính Ngọ",
      venue: "Tư gia nhà trai",
      address: "Thôn Phúc Hoà, Xã Thác Bà, Tỉnh Lào Cai",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Th%C3%B4n%20Ph%C3%BAc%20H%C3%B2a%2C%20X%C3%A3%20Th%C3%A1c%20B%C3%A0%2C%20L%C3%A0o%20Cai",
      audience: ["nha-trai", "public"],
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
    // Gồm 2 thư mục con: "Ảnh phóng" (7 ảnh lớn, dùng cho bìa / ảnh đầu / ảnh chèn / màn hình lớn)
    // và "Ảnh con" (30 ảnh, dùng cho album + ảnh chân dung). Mã pNN theo thứ tự tên:
    //   p01–p30 = Ảnh con DUN00001 … DUN09995, p31–p37 = Ảnh phóng DUN00013 … DUN09723
    // (xem photos/manifest.json hoặc mở photos-contact-sheet.html để biết mã nào là ảnh nào).
    source: "C:/Users/Trung lv/Pictures/me/anh-cuoi",
    shareFrom: "p04", // ảnh chia sẻ Zalo/Facebook 1200x630: hai bạn tạo hình trái tim trong vườn (ảnh ngang)
    sharePosition: "center",
    cover: "p36", // bìa thư (khung vòm): vest trắng dưới vòm hoa, nhìn nhau
    hero: "p32", // ảnh lớn đầu thiệp: trong vườn, vest đen + váy cưới
    statement: "p01", // nền mờ sau lời mời: tà voan bay trong vườn (ảnh ngang)
    // Ảnh phóng chèn xen giữa các phần tương tác (sau: cặp đôi, đếm ngược, mừng cưới, xác nhận)
    middle: ["p33", "p35", "p34", "p37"],
    ending: "p31", // ảnh cuối thiệp: trong vườn
    // Màn hình máy tính: cột ảnh bên trái trình chiếu lần lượt các ảnh phóng
    desktop: ["p36", "p32", "p33", "p35", "p34", "p37", "p31"],
    // Ảnh cắt từ một vùng của ảnh gốc (left/top/width/height theo tỉ lệ 0..1 của ảnh gốc đã xoay đúng chiều).
    crops: {
      // Cả hai cùng cắt từ DUN00081 (ảnh ngang 3:2, hai bạn nhìn thẳng, rõ nét) để đồng bộ ánh sáng và nền
      "p04-chu-re": { from: "p04", left: 0.2, top: 0.03, width: 0.26, height: 0.4875 }, // chú rể, khung dọc 4:5
      "p04-co-dau": { from: "p04", left: 0.47, top: 0.16, width: 0.26, height: 0.4875 }, // cô dâu, khung dọc 4:5
    },
  },

  // --- Album (hướng B hiển thị thành lưới ảnh theo thứ tự front rồi back của từng "lá") ---
  // 12 ảnh đầu hiện ngay (đủ các bối cảnh), còn lại sau nút "Xem thêm".
  album: {
    kicker: "Khoảnh khắc",
    title: "Album ảnh cưới",
    leaves: [
      { front: "p04", back: "p15", frontAlt: "Trái tim trao nhau", backAlt: "Chạm trán" },
      { front: "p25", back: "p19", frontAlt: "Dưới vòm hoa", backAlt: "Bên cây đàn piano" },
      { front: "p01", back: "p22", frontAlt: "Tà voan bay trong vườn", backAlt: "Áo dài truyền thống" },
      { front: "p05", back: "p27", frontAlt: "Bên sofa cổ điển", backAlt: "Ánh mắt nàng" },
      { front: "p23", back: "p02", frontAlt: "Ôm nhau trên phố", backAlt: "Vẫy tay trong vườn" },
      { front: "p20", back: "p28", frontAlt: "Bên đàn piano", backAlt: "Hai đứa mình" },
      { front: "p03", back: "p06", frontAlt: "Niềm vui trong vườn", backAlt: "Khoảnh khắc trong sảnh" },
      { front: "p07", back: "p08", frontAlt: "Bên bức tranh cổ", backAlt: "Ngồi cạnh nhau" },
      { front: "p09", back: "p10", frontAlt: "Sảnh cổ điển", backAlt: "Đối diện nhau" },
      { front: "p11", back: "p12", frontAlt: "Đợi nhau", backAlt: "Dắt tay cô dâu" },
      { front: "p13", back: "p14", frontAlt: "Mời nàng một điệu nhảy", backAlt: "Dưới chùm đèn pha lê" },
      { front: "p16", back: "p17", frontAlt: "Nhẫn cưới", backAlt: "Bó hoa và nhẫn" },
      { front: "p18", back: "p21", frontAlt: "Khoe nhẫn cưới", backAlt: "Tựa vào nhau" },
      { front: "p24", back: "p26", frontAlt: "Dạo phố", backAlt: "Căn phòng trắng" },
      { front: "p29", back: "p30", frontAlt: "Trao hoa bên đài phun nước", backAlt: "Bên đài phun nước" },
    ],
  },

  // --- Nhạc nền (bật khi khách bấm "Mở thiệp"). Để src rỗng = không có nhạc ---
  music: {
    // Dùng chung file với phương án A: public/music/beautiful-in-white.mp3 ở thư mục gốc
    // (hoặc đặt riêng trong huong-b/music/). Chưa có file thì nút nhạc tự ẩn.
    src: "music/beautiful-in-white.mp3",
    title: "Beautiful in White",
    artist: "Shane Filan",
    lyrics: null,
  },

  // --- Lời văn, theo thiệp in. {khach} = cách xưng hô với khách (vd "Bác Hùng"), không có mã khách thì là "Quý vị" ---
  texts: {
    quote: "Từ một lời hẹn ngày dạm ngõ, thành một đời thương nhau.", // (gợi ý)
    invitation: "Trân trọng kính mời {khach} tới dự bữa cơm thân mật mừng lễ thành hôn của chúng tôi.",
    coverLine: "tới dự bữa cơm thân mật mừng lễ thành hôn của chúng tôi", // dòng dưới tên khách trên bìa
    thankYou: "Sự hiện diện của Quý vị là niềm vinh hạnh cho gia đình chúng tôi!",
    // Lời riêng theo từng nhà (khách nhà nào, hoặc link ?ben=nha-trai / ?ben=nha-gai).
    // Thiệp nhà gái: cô dâu đứng trước (tự đảo thứ tự).
    bySide: {
      "nha-trai": {
        invitation: "Trân trọng kính mời {khach} tới dự bữa cơm thân mật mừng lễ thành hôn của chúng tôi.",
        coverLine: "tới dự bữa cơm thân mật mừng lễ thành hôn của chúng tôi",
      },
      "nha-gai": {
        invitation: "Trân trọng kính mời {khach} tới dự bữa cơm thân mật mừng lễ vu quy của chúng tôi.",
        coverLine: "tới dự bữa cơm thân mật mừng lễ vu quy của chúng tôi",
      },
    },
  },

  // --- Thứ tự các phần trên thiệp. Bỏ tên nào khỏi danh sách thì phần đó bị ẩn ---
  sections: ["cover", "hero", "invitation", "couple", "events", "countdown", "album", "music", "gifts", "rsvp", "wishes", "ending"],

  // --- Kết nối Google Sheet (Apps Script do hướng A viết) ---
  backend: {
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbweK_k5I16ouNV189PTuKVvl_dJfq5KNAK6ltCqHaCRxO78p8huvzEPG4_42DN8FZfjVg/exec", // Web App của Google Sheet "Thiệp cưới Trung & Nhi — khách mời" (để rỗng = chế độ demo)
    rsvpDeadline: "2026-12-02", // (gợi ý) 10 ngày trước tiệc cưới
    maxGuestsPerInvite: 4,
  },
};
