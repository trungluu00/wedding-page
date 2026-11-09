# Thiệp cưới online — Lưu Viết Trung & Đoàn Phương Nhi

Trang thiệp cưới tĩnh (Vite), giữ toàn bộ hiệu ứng: bìa thư mở thiệp, nhạc chạy lời, album lật trang 3D,
lời chúc bay, bắn tim, confetti, đếm ngược, lịch tháng, hiện dần khi cuộn.

- **Không có server riêng.** Build ra thư mục `dist/` rồi đưa lên Cloudflare Pages (hoặc Vercel, Netlify…).
- **Mọi nội dung và màu sắc nằm trong một file:** [`wedding.config.js`](wedding.config.js).
- **Dữ liệu khách mời, xác nhận tham dự, lời chúc** nằm trong Google Sheet, đọc/ghi qua Google Apps Script
  ([`apps-script/Code.gs`](apps-script/Code.gs)).

```
wedding.config.js         ← file duy nhất cần sửa
public/photos/            ← ảnh thật (tự tạo thư mục này)
public/music/             ← nhạc .mp3 và lời .lrc
apps-script/Code.gs       ← dán vào Apps Script của Google Sheet
build/wedding-plugin.js   ← plugin Vite: theme, font, thẻ og:*, ảnh giữ chỗ (không cần sửa)
index.html, js/, css/     ← giao diện và hiệu ứng (không cần sửa để đổi nội dung)
```

## 1. Chạy thử trên máy

Cần Node.js 18 trở lên.

```bash
npm install
```

```bash
npm run dev
```

Mở http://localhost:5173. Thử link mời mẫu: http://localhost:5173/?to=bac-hung (khách nhà trai) và
http://localhost:5173/?to=ban-lan (khách nhà gái).

Khi `backend.appsScriptUrl` còn trống, trang chạy **chế độ demo**: không gọi mạng, RSVP và lời chúc chỉ lưu
trong trình duyệt đang mở (Console có dòng thông báo "Chế độ demo"). Hai khách mẫu ở trên chỉ có trong chế độ demo.

## 2. Sửa nội dung trong `wedding.config.js`

File có chú thích tiếng Việt cho từng mục. Các phần chính:

| Mục | Nội dung |
|---|---|
| `site` | Tên miền, tiêu đề và mô tả hiện khi gửi link qua Zalo/Facebook, ảnh xem trước 1200x630 |
| `theme` | Bộ màu, font, hoa văn (xem mục 3) |
| `couple` | Tên đầy đủ, tên gọi, ảnh chân dung, giới thiệu, số điện thoại, bố mẹ, địa chỉ của cô dâu chú rể |
| `events` | Các sự kiện (lễ vu quy, lễ thành hôn, tiệc cưới…), mỗi sự kiện có `audience` để chọn ai được thấy |
| `schedule` | Lịch trình trong ngày (giờ, tiêu đề, biểu tượng) |
| `gifts` | Tài khoản mừng cưới, tách nhà trai / nhà gái, mã QR VietQR tự sinh |
| `photos`, `album` | Ảnh bìa, ảnh giữa trang, ảnh kết, các trang album lật |
| `music` | File nhạc, tên bài, ca sĩ, file lời `.lrc` |
| `texts` | Câu trích dẫn, lời mời, lời cảm ơn (xuống dòng bằng `\n`) |
| `sections` | Các phần hiện trên thiệp **theo đúng thứ tự**; xóa tên khỏi danh sách để ẩn |
| `backend` | URL Apps Script, hạn xác nhận tham dự, số người tối đa mỗi thiệp |

**Ảnh — dùng `npm run photos`:**

1. Để ảnh gốc ở một thư mục trên máy (không nằm trong repo), ghi đường dẫn vào `photos.source`
   trong `wedding.config.js` (hoặc đặt biến môi trường `PHOTO_SOURCE`).
2. Chạy:

   ```bash
   npm run photos
   ```

   Script (dùng `sharp`) **chỉ xuất những ảnh được ghi trong `wedding.config.js`** (ảnh bìa, lời mời,
   giữa trang, kết, chân dung, album). Mỗi ảnh có **mã** lấy từ tên file: `IMG_3788.jpg` → `img3788`,
   `IMG_3808_1.jpg` → `img3808-1`. Mỗi ảnh có 4 cỡ WebP chất lượng 88 trong `public/photos/`: cạnh dài
   400 (thumbnail), 900 (điện thoại), 1600 (hiển thị), 2560 (phóng to). Giữ hướng xoay, chuyển về sRGB,
   bỏ EXIF/GPS, không phóng to ảnh nhỏ. `photos.crops` cắt chân dung khung 4:5 từ ảnh chụp chung.
   `share-1200x630.jpg` (JPEG q90, 4:4:4) được tạo từ ảnh `photos.share` làm ảnh xem trước khi gửi link.
   Ảnh đã xuất mà config không còn dùng sẽ tự bị xóa. Chạy lại chỉ xử lý ảnh mới hoặc đã sửa.
   Ảnh gốc không bao giờ bị chép vào repo.
3. Mở `npm run dev` rồi vào http://localhost:5173/photos-contact-sheet.html: mọi ảnh trong thư mục nguồn,
   ảnh nào đang dùng có viền xanh và ghi rõ vị trí. Đổi mã trong config rồi chạy lại `npm run photos`.

Album lật trang tự đặt ảnh ngang trọn trên nền giấy (không cắt mặt); ghi `frontFit`/`backFit` để đổi.
Trang tự dùng `srcset`: điện thoại tải cỡ vừa đủ nhưng vẫn nét trên màn hình retina, phóng to trong album
dùng bản 2560. Vẫn có thể ghi đường dẫn file trực tiếp (vd `photos/rieng.jpg` trong `public/`).
Đường dẫn dạng `photos/placeholder/<tên>.svg` là ảnh giữ chỗ tự sinh theo màu theme.

**Sự kiện theo nhóm khách:** `audience: ["all"]` thì ai cũng thấy. `["nha-trai"]` / `["nha-gai"]` khớp cột `side`
của khách trong Sheet; tên nhóm khác (vd `"gia-dinh"`) khớp cột `groups`. Sự kiện có `main: true` dùng cho
ngày lớn, lịch và đếm ngược.

**Lời bài hát:** file `.lrc`, mỗi dòng `[phút:giây.xx]Lời`. Có thể tạo bằng các trang/ứng dụng "LRC editor".

Sửa xong lưu file, trang ở `npm run dev` tự tải lại.

## 3. Đổi theme

```js
theme: {
  preset: "luc-bao",      // "luc-bao" | "xo-thom" | "navy" | "xanh-bui"
  colors: { primary: "#1f5c45" }, // (tùy chọn) ghi đè từng màu của preset
  fonts: { display: "Playfair Display", body: "Be Vietnam Pro", script: "Great Vibes" },
  ornament: "song-hy",    // "song-hy" (囍) | "monogram" (T · N) | "none"
}
```

| Preset | primary | accent | background | surface | text |
|---|---|---|---|---|---|
| `luc-bao` (mặc định) | `#1f5c45` | `#b8975a` | `#f7f1e5` | `#fffdf8` | `#1c2a24` |
| `xo-thom` | `#5f7f65` | `#c9a97c` | `#f6f1e7` | `#fffefa` | `#26302a` |
| `navy` | `#1f3a5f` | `#c4a46a` | `#f5f0e6` | `#fffdf8` | `#1b2533` |
| `xanh-bui` | `#4f7397` | `#d6bb8e` | `#f8f4ec` | `#ffffff` | `#22303d` |

Chỉ cần 5 màu gốc; các màu phụ được tính lúc build (đậm = primary trộn 35% text, nhạt = primary trộn 85% nền,
chữ phụ, đường viền, màu chữ trên nút). Toàn bộ CSS dùng biến `--c-*`, nên đổi preset là đổi màu cả trang.
Font là tên font trên [Google Fonts](https://fonts.google.com) (nên chọn font hỗ trợ tiếng Việt).

## 4. Cài backend Google Sheet + Apps Script

1. Tạo một Google Sheet mới (vd "Thiệp cưới Trung Nhi").
2. Menu **Tiện ích mở rộng → Apps Script**. Xóa code mẫu, dán toàn bộ nội dung [`apps-script/Code.gs`](apps-script/Code.gs), bấm Lưu.
3. Chọn hàm `setupDatabase` ở thanh trên → **Chạy**. Lần đầu Google hỏi quyền: chọn tài khoản →
   "Advanced / Nâng cao" → "Go to … (unsafe)" → Cho phép. Script tạo các sheet:
   - `CauHinh`: ô **B1** điền tên miền thiệp, vd `https://trung-nhi.pages.dev` (không có `/` ở cuối).
   - `KhachMoi`: danh sách khách (code, name, xungHo, side, groups, phone, notes, link, rsvpStatus, guestCount).
   - `RSVP`, `LoiChuc` (cột **Hiện**: bỏ tick để ẩn một lời chúc), `LuotMo` (ai đã mở thiệp).
4. **Triển khai → Tùy chọn triển khai mới** → biểu tượng bánh răng → **Ứng dụng web**:
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai** (Anyone)
   - Bấm Triển khai, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).
5. Dán URL vào `backend.appsScriptUrl` trong `wedding.config.js`, build và deploy lại.
6. Kiểm tra: mở `URL/exec?action=lookup&code=bac-hung` trên trình duyệt phải thấy `"found":true`.

Khi sửa `Code.gs` sau này: **Triển khai → Quản lý triển khai → sửa (bút chì) → Phiên bản: Mới → Triển khai**
để giữ nguyên URL.

**Bảo mật mức cơ bản:** lookup chỉ trả về đúng một khách theo mã; dữ liệu khách nhập được giới hạn độ dài
(tên ≤ 80, lời chúc ≤ 500, số người 0–10), có ô bẫy bot, khóa ghi đồng thời, và chặn chuỗi bắt đầu bằng `=`
bị Sheets hiểu là công thức. Ai có link Web App đều gửi được RSVP/lời chúc — đây là đánh đổi chấp nhận được
cho thiệp cưới. Muốn ẩn lời chúc không phù hợp: bỏ tick cột **Hiện** (trang cập nhật sau tối đa 60 giây).

## 5. Tạo link mời riêng cho từng khách

1. Trong sheet `KhachMoi`, mỗi khách một dòng:
   - `name`: tên gọi (vd `Hùng`), `xungHo`: cách xưng (vd `Bác`) → bìa thiệp hiện "Kính mời Bác Hùng".
   - `side`: `nha-trai` / `nha-gai` / `ban-chung` (chọn từ danh sách).
   - `groups`: nhóm, cách nhau dấu phẩy (vd `gia-dinh`), dùng để hiện các sự kiện riêng.
   - `code`: để trống, script tự sinh từ xưng hô + tên (vd `bac-hung`), tự thêm số nếu trùng.
     Hoặc dùng menu **💌 Thiệp cưới → Sinh code cho khách còn trống**.
2. Cột `link` tự ghép thành `https://tên-miền/?to=bac-hung` — sao chép gửi qua Zalo/Messenger.
3. Khi khách xác nhận tham dự, cột `rsvpStatus` / `guestCount` tự cập nhật; chi tiết ở sheet `RSVP`.

Link không có `?to=` vẫn xem được thiệp, chỉ thấy các sự kiện `audience: ["all"]`.

## 6. Deploy lên Cloudflare Pages

**Cách 1 — kết nối GitHub (tự build mỗi lần push):**
1. Đẩy repo lên GitHub.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → chọn repo.
3. Build settings: Framework preset **None** (hoặc Vite), Build command `npm run build`,
   Build output directory `dist`. Nếu cần, thêm biến môi trường `NODE_VERSION` = `20`.
4. Save and Deploy. Tên miền mặc định dạng `https://<tên-dự-án>.pages.dev`; có thể gắn tên miền riêng ở
   tab **Custom domains**.

**Cách 2 — tải thư mục lên tay:**

```bash
npm run build
```

Rồi Cloudflare → Pages → **Upload assets** → kéo thả thư mục `dist/`.

Sau khi có tên miền thật: cập nhật `site.domain` trong `wedding.config.js` **và** ô `CauHinh!B1` trong Sheet,
rồi build/deploy lại (thẻ `og:image` cần URL tuyệt đối để Zalo/Facebook hiện ảnh xem trước).
Facebook giữ cache ảnh xem trước; dùng [Sharing Debugger](https://developers.facebook.com/tools/debug/) để làm mới.

(Vercel/Netlify tương tự: build `npm run build`, thư mục `dist`.)

## 7. Danh sách TODO cần điền

Trong `wedding.config.js`: `// TODO` là thông tin thật cần điền/xác nhận; `// (gợi ý)` là câu chữ đã viết sẵn,
sửa tùy ý. Ngày âm lịch tính bằng `npm run lunar -- YYYY-MM-DD` (vd `npm run lunar -- 2026-12-13`).

**Đã có (bạn điền hoặc đã soạn sẵn)**
- [x] Tên, bố mẹ, địa chỉ, số điện thoại hai bên
- [x] Ảnh: bìa, lời mời, giữa trang, kết, chân dung, album 12 tờ, ảnh chia sẻ (`npm run photos`)
- [x] (gợi ý) Mô tả khi chia sẻ link, giới thiệu chú rể / cô dâu, câu trích, lời mời, lời cảm ơn,
      tên các mốc lịch trình, chú thích album, hạn xác nhận (10 ngày trước tiệc)
- [x] Âm lịch tính đúng theo ngày đang ghi; địa chỉ Lễ Vu Quy / Lễ Thành Hôn lấy theo địa chỉ hai nhà

**Cần bạn điền / xác nhận**
- [ ] `site.domain` — tên miền thật (và ô `CauHinh!B1` trong Sheet)
- [ ] `couple.*.role` — Trưởng nam/Thứ nam…, Trưởng nữ/Út nữ…
- [ ] `couple.bride.familyPhone` — đang trùng số cô dâu
- [ ] **Ngày giờ các sự kiện**: Lễ Vu Quy và Lễ Thành Hôn 13/12/2026 (05/11 âm); Tiệc cưới đang đặt 12/12/2026
      (04/11 âm) — xác nhận ngày tiệc và giờ từng sự kiện; đổi ngày thì chạy `npm run lunar` để cập nhật `lunar`
- [ ] `mapsUrl` hai lễ tại nhà — đang là link tìm theo địa chỉ; nên thay bằng link ghim đúng cổng nhà
- [ ] Tiệc cưới: `venue`, `address`, `mapsUrl` (tên và địa chỉ nơi tổ chức)
- [ ] Kiểm tra `audience` từng sự kiện (ai được thấy) cho đúng thực tế
- [ ] `schedule` — giờ các mốc theo giờ tiệc thật
- [ ] `gifts.accounts` — `bankBin`, `bankName`, `accountNo`, `accountName` (hoặc `qrImage`)
- [ ] **Thay bài hát**: `music/le-duong.mp3` ("Lễ Đường" — Kai Đinh) có bản quyền, chỉ dùng tạm.
      Thay `src`, `title`, `artist`, `lyrics` (.lrc) và xóa file cũ khỏi `public/music/`
- [ ] `backend.appsScriptUrl` — URL Web App (mục 4); xóa 2 khách mẫu `bac-hung`, `ban-lan` trong sheet `KhachMoi`
