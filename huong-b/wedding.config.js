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
    ogImage: "photos/share-1200x630.jpg", // TODO: ảnh JPG 1200x630 khi chia sẻ link (Zalo/Facebook không nhận SVG/WebP)
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
      portrait: "photos/groom.jpg", // TODO: ảnh chân dung chú rể (dọc, khoảng 800x1000)
      bio: "Trưởng nam của gia đình.", // TODO
      phone: "0900000001", // TODO: số điện thoại chú rể (để khách gọi hỏi đường)
      father: "Ông Lưu Văn A", // TODO
      mother: "Bà Nguyễn Thị B", // TODO
      address: "Số 1 đường ABC, phường X, quận Y, Hà Nội", // TODO
    },
    bride: {
      fullName: "Đoàn Phương Nhi",
      shortName: "Nhi",
      portrait: "photos/bride.jpg", // TODO: ảnh chân dung cô dâu
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
  photos: {
    hero: "photos/hero.jpg", // TODO: ảnh bìa (dọc, khoảng 1080x1350)
    statement: "photos/statement.jpg", // TODO: ảnh nền phần lời mời
    middle: ["photos/middle-1.jpg", "photos/middle-2.jpg"], // TODO: ảnh chèn giữa các phần
    ending: "photos/ending.jpg", // TODO: ảnh cuối thiệp
  },

  // --- Album (hướng B hiển thị thành một album ảnh trượt: front rồi back của từng "lá") ---
  album: {
    leaves: [
      { front: "photos/album-1.jpg", back: "photos/album-2.jpg", frontAlt: "Ảnh cưới 1", backAlt: "Ảnh cưới 2" }, // TODO
      { front: "photos/album-3.jpg", back: "photos/album-4.jpg", frontAlt: "Ảnh cưới 3", backAlt: "Ảnh cưới 4" }, // TODO
      { front: "photos/album-5.jpg", back: "photos/album-6.jpg", frontAlt: "Ảnh cưới 5", backAlt: "Ảnh cưới 6" }, // TODO
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
