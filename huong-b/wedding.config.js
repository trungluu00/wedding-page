// =============================================================================
//  CẤU HÌNH THIỆP CƯỚI — Lưu Viết Trung & Đoàn Phương Nhi (hướng B)
//  Mọi nội dung, ảnh, màu sắc của thiệp đều sửa ở file này.
//  Khung (schema) dùng chung với hướng A: đừng đổi tên khóa, chỉ đổi giá trị.
//  Các dòng có "TODO" là giá trị giữ chỗ, cần thay bằng thông tin thật.
//  Sửa xong chạy `npm run build` (hoặc để `npm run dev` tự tải lại).
// =============================================================================

export default {
  // --- Thông tin trang (dùng cho tiêu đề tab và ảnh xem trước khi gửi link qua Zalo/Facebook) ---
  site: {
    domain: "https://TODO", // TODO: địa chỉ thật sau khi deploy, vd "https://trung-nhi.pages.dev" (không có "/" cuối)
    title: "Thiệp cưới Trung & Nhi",
    description: "Trân trọng kính mời bạn tới chung vui trong ngày cưới của Trung & Nhi.", // TODO: viết lại nếu muốn
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
      shortName: "Trung",
      portrait: "p41", // chưa có ảnh chú rể chụp riêng; p41 là chú rể đứng cạnh cô dâu — đổi khi có ảnh riêng
      bio: "Trưởng nam của gia đình.", // TODO
      phone: "0900000001", // TODO: số điện thoại chú rể (để khách gọi hỏi đường)
      father: "Ông Lưu Văn A", // TODO
      mother: "Bà Nguyễn Thị B", // TODO
      address: "Số 1 đường ABC, phường X, quận Y, Hà Nội", // TODO
    },
    bride: {
      fullName: "Đoàn Phương Nhi",
      shortName: "Nhi",
      portrait: "p53", // cô dâu ngồi, nhìn thẳng
      bio: "Út nữ của gia đình.", // TODO
      phone: "0900000002", // TODO
      father: "Ông Đoàn Văn C", // TODO
      mother: "Bà Trần Thị D", // TODO
      address: "Số 2 đường DEF, phường Z, quận W, Hà Nội", // TODO
    },
  },

  // --- Các sự kiện ---
  // date: "YYYY-MM-DD", time: "HH:mm" (giờ Việt Nam). lunar: ghi sẵn dạng chữ (không tự tính).
  // audience: ai thấy sự kiện này. "all" = mọi khách; "nha-trai" / "nha-gai" / tên nhóm khác
  //   khớp với cột side/groups của khách trong Google Sheet.
  events: [
    {
      id: "vu-quy",
      name: "Lễ Vu Quy",
      date: "2027-01-09", // TODO
      time: "09:00", // TODO
      lunar: "Tức ngày 02 tháng Chạp năm Bính Ngọ", // TODO: kiểm tra lại lịch âm
      venue: "Tư gia nhà gái", // TODO
      address: "Số 2 đường DEF, phường Z, quận W, Hà Nội", // TODO
      mapsUrl: "https://maps.google.com/?q=Ha+Noi", // TODO: link Google Maps thật
      audience: ["nha-gai"],
    },
    {
      id: "thanh-hon",
      name: "Lễ Thành Hôn",
      date: "2027-01-10", // TODO
      time: "09:00", // TODO
      lunar: "Tức ngày 03 tháng Chạp năm Bính Ngọ", // TODO: kiểm tra lại lịch âm
      venue: "Tư gia nhà trai", // TODO
      address: "Số 1 đường ABC, phường X, quận Y, Hà Nội", // TODO
      mapsUrl: "https://maps.google.com/?q=Ha+Noi", // TODO
      audience: ["nha-trai"],
    },
    {
      id: "tiec-cuoi",
      name: "Tiệc cưới",
      date: "2027-01-10", // TODO
      time: "11:00", // TODO
      lunar: "Tức ngày 03 tháng Chạp năm Bính Ngọ", // TODO: kiểm tra lại lịch âm
      venue: "Trung tâm tiệc cưới TODO", // TODO
      address: "Sảnh A, số 99 đường GHI, Hà Nội", // TODO
      mapsUrl: "https://maps.google.com/?q=Ha+Noi", // TODO
      audience: ["all"],
    },
  ],

  // --- Lịch trình ngày cưới (icon: tên icon Font Awesome 6, vd "fa-ring") ---
  schedule: [
    { time: "10:30", title: "Đón khách", icon: "fa-champagne-glasses" }, // TODO
    { time: "11:00", title: "Làm lễ", icon: "fa-ring" }, // TODO
    { time: "11:30", title: "Khai tiệc", icon: "fa-utensils" }, // TODO
    { time: "13:00", title: "Chụp ảnh lưu niệm", icon: "fa-camera" }, // TODO
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
        accountNo: "0000000001", // TODO
        accountName: "LUU VIET TRUNG", // TODO: tên chủ tài khoản, IN HOA không dấu
        qrImage: null,
      },
      {
        family: "nha-gai",
        owner: "Cô dâu Đoàn Phương Nhi",
        bankBin: "970407", // TODO
        bankName: "Techcombank", // TODO
        accountNo: "0000000002", // TODO
        accountName: "DOAN PHUONG NHI", // TODO
        qrImage: null,
      },
    ],
  },

  // --- Ảnh ---
  // Ghi MÃ ẢNH (p01...p55) do `npm run photos` sinh ra: thiệp tự chọn cỡ ảnh vừa màn hình (srcset)
  // và mở bản 2560px khi chạm vào. Xem toàn bộ mã ảnh trong photos-contact-sheet.html.
  // Vẫn có thể ghi đường dẫn thường, vd "photos/abc.jpg".
  photos: {
    // Thư mục ảnh gốc trên máy (chỉ dùng cho `npm run photos`; ảnh gốc không deploy, không commit).
    // Có thể thay bằng biến môi trường PHOTO_SOURCE.
    source: "C:/Users/Trung lv/Pictures/me/dam-ngo",
    shareFrom: "p11", // ảnh cắt ra ảnh chia sẻ Zalo/Facebook 1200x630 (photos/share-1200x630.jpg); chạy lại npm run photos sau khi đổi
    hero: "p30", // ảnh lớn đầu thiệp (dọc): hai bạn đứng cạnh bảng tên
    statement: "p16", // ảnh nền mờ phía sau lời mời: hai bạn đi cạnh nhau
    middle: ["p12", "p27"], // ảnh ngang chèn giữa các phần
    ending: "p26", // ảnh cuối thiệp (dọc)
  },

  // --- Album (hướng B hiển thị thành lưới ảnh: front rồi back của từng "lá") ---
  // Đang gồm cả 55 ảnh theo thứ tự chụp; xóa dòng nào để bỏ ảnh đó.
  album: {
    leaves: [
      { front: "p01", back: "p02", frontAlt: "Ảnh dạm ngõ 1", backAlt: "Ảnh dạm ngõ 2" },
      { front: "p03", back: "p04", frontAlt: "Ảnh dạm ngõ 3", backAlt: "Ảnh dạm ngõ 4" },
      { front: "p05", back: "p06", frontAlt: "Ảnh dạm ngõ 5", backAlt: "Ảnh dạm ngõ 6" },
      { front: "p07", back: "p08", frontAlt: "Ảnh dạm ngõ 7", backAlt: "Ảnh dạm ngõ 8" },
      { front: "p09", back: "p10", frontAlt: "Ảnh dạm ngõ 9", backAlt: "Ảnh dạm ngõ 10" },
      { front: "p11", back: "p12", frontAlt: "Ảnh dạm ngõ 11", backAlt: "Ảnh dạm ngõ 12" },
      { front: "p13", back: "p14", frontAlt: "Ảnh dạm ngõ 13", backAlt: "Ảnh dạm ngõ 14" },
      { front: "p15", back: "p16", frontAlt: "Ảnh dạm ngõ 15", backAlt: "Ảnh dạm ngõ 16" },
      { front: "p17", back: "p18", frontAlt: "Ảnh dạm ngõ 17", backAlt: "Ảnh dạm ngõ 18" },
      { front: "p19", back: "p20", frontAlt: "Ảnh dạm ngõ 19", backAlt: "Ảnh dạm ngõ 20" },
      { front: "p21", back: "p22", frontAlt: "Ảnh dạm ngõ 21", backAlt: "Ảnh dạm ngõ 22" },
      { front: "p23", back: "p24", frontAlt: "Ảnh dạm ngõ 23", backAlt: "Ảnh dạm ngõ 24" },
      { front: "p25", back: "p26", frontAlt: "Ảnh dạm ngõ 25", backAlt: "Ảnh dạm ngõ 26" },
      { front: "p27", back: "p28", frontAlt: "Ảnh dạm ngõ 27", backAlt: "Ảnh dạm ngõ 28" },
      { front: "p29", back: "p30", frontAlt: "Ảnh dạm ngõ 29", backAlt: "Ảnh dạm ngõ 30" },
      { front: "p31", back: "p32", frontAlt: "Ảnh dạm ngõ 31", backAlt: "Ảnh dạm ngõ 32" },
      { front: "p33", back: "p34", frontAlt: "Ảnh dạm ngõ 33", backAlt: "Ảnh dạm ngõ 34" },
      { front: "p35", back: "p36", frontAlt: "Ảnh dạm ngõ 35", backAlt: "Ảnh dạm ngõ 36" },
      { front: "p37", back: "p38", frontAlt: "Ảnh dạm ngõ 37", backAlt: "Ảnh dạm ngõ 38" },
      { front: "p39", back: "p40", frontAlt: "Ảnh dạm ngõ 39", backAlt: "Ảnh dạm ngõ 40" },
      { front: "p41", back: "p42", frontAlt: "Ảnh dạm ngõ 41", backAlt: "Ảnh dạm ngõ 42" },
      { front: "p43", back: "p44", frontAlt: "Ảnh dạm ngõ 43", backAlt: "Ảnh dạm ngõ 44" },
      { front: "p45", back: "p46", frontAlt: "Ảnh dạm ngõ 45", backAlt: "Ảnh dạm ngõ 46" },
      { front: "p47", back: "p48", frontAlt: "Ảnh dạm ngõ 47", backAlt: "Ảnh dạm ngõ 48" },
      { front: "p49", back: "p50", frontAlt: "Ảnh dạm ngõ 49", backAlt: "Ảnh dạm ngõ 50" },
      { front: "p51", back: "p52", frontAlt: "Ảnh dạm ngõ 51", backAlt: "Ảnh dạm ngõ 52" },
      { front: "p53", back: "p54", frontAlt: "Ảnh dạm ngõ 53", backAlt: "Ảnh dạm ngõ 54" },
      { front: "p55", back: null, frontAlt: "Ảnh dạm ngõ 55", backAlt: null },
    ],
  },

  // --- Nhạc nền (bật khi khách bấm "Mở thiệp"). Để src rỗng = không có nhạc ---
  music: {
    src: "", // TODO: vd "music/bai-hat.mp3" (nên < 3 MB, có bản quyền sử dụng)
    title: "", // TODO
    artist: "", // TODO
    lyrics: null,
  },

  // --- Lời văn. {khach} sẽ được thay bằng cách xưng hô với khách, vd "Bác Hùng" hoặc "Quý khách" ---
  texts: {
    quote: "Hai người, một lời hẹn, cùng nhau đi hết con đường dài.", // TODO
    invitation:
      "Trân trọng kính mời {khach} tới dự buổi lễ thành hôn và chung vui cùng gia đình chúng tôi.", // TODO
    thankYou:
      "Sự hiện diện của {khach} là niềm vinh hạnh cho gia đình chúng tôi. Xin chân thành cảm ơn!", // TODO
  },

  // --- Thứ tự các phần trên thiệp. Bỏ tên nào khỏi danh sách thì phần đó bị ẩn ---
  sections: ["cover", "hero", "invitation", "couple", "events", "schedule", "countdown", "album", "music", "gifts", "rsvp", "wishes", "ending"],

  // --- Kết nối Google Sheet (Apps Script do hướng A viết) ---
  backend: {
    appsScriptUrl: "", // TODO: dán URL Web App Apps Script (…/exec). Để rỗng = chế độ demo, dữ liệu lưu trong trình duyệt.
    rsvpDeadline: "2026-12-31", // TODO: hạn xác nhận tham dự (YYYY-MM-DD)
    maxGuestsPerInvite: 4,
  },
};
