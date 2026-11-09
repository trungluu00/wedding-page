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

**Ảnh:** đặt vào `public/photos/` và ghi đường dẫn tính từ `public/`, ví dụ `photos/hero.jpg`.
Đường dẫn dạng `photos/placeholder/<tên>.svg` là ảnh giữ chỗ tự sinh theo màu theme; thay bằng ảnh thật khi có.
Kích thước gợi ý được ghi cạnh từng mục. Nên nén ảnh (JPG chất lượng ~80, cạnh dài ≤ 1600px) để thiệp mở nhanh.

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

Tất cả nằm trong `wedding.config.js` (tìm chữ `TODO`), trừ các mục có ghi chú khác.

**Trang & chia sẻ**
- [ ] `site.domain` — tên miền thật (và ô `CauHinh!B1` trong Sheet)
- [ ] `site.description` — câu mô tả khi chia sẻ link (tùy chọn chỉnh)
- [ ] `site.ogImage` — tạo ảnh 1200x630 đặt tại `public/photos/share-1200x630.jpg` (hiện chưa có file; build sẽ cảnh báo)

**Cô dâu chú rể** (`couple.groom` và `couple.bride`)
- [ ] `role` — Trưởng nam/Thứ nam…, Trưởng nữ/Út nữ…
- [ ] `portrait` — ảnh chân dung vuông
- [ ] `bio` — giới thiệu ngắn
- [ ] `phone` — số điện thoại
- [ ] `father`, `mother` — họ tên bố mẹ (đang là "Ông Lưu Viết TODO"…)
- [ ] `address` — địa chỉ gia đình
- [ ] `familyPhone` — (tùy chọn) SĐT đại diện gia đình

**Sự kiện** (`events`, cả 3 sự kiện)
- [ ] `date`, `time`, `endTime`
- [ ] `lunar` — ngày âm lịch ghi bằng chữ (đang là giá trị tạm, cần tra lại)
- [ ] `venue`, `address`, `mapsUrl`
- [ ] Kiểm tra lại danh sách sự kiện và `audience` cho đúng thực tế

**Lịch trình** (`schedule`)
- [ ] Giờ và tên từng mốc

**Mừng cưới** (`gifts.accounts`, cả 2 tài khoản)
- [ ] `bankBin`, `bankName`, `accountNo`, `accountName` (hoặc `qrImage` nếu có ảnh QR sẵn)

**Ảnh** (`photos`, `album.leaves`)
- [ ] `photos.hero`, `photos.statement`, `photos.middle[0..1]`, `photos.ending`
- [ ] 12 ảnh trang album (6 tờ: bìa trước, 10 trang trong, bìa sau) + chú thích `frontAlt`/`backAlt`

**Nhạc** (`music`)
- [ ] **Thay bài hát**: `music/le-duong.mp3` ("Lễ Đường" — Kai Đinh) là bài có bản quyền, chỉ dùng tạm để thử.
      Thay `src`, `title`, `artist` và file lời `lyrics` (.lrc) tương ứng; xóa file mp3/lrc cũ khỏi `public/music/`.

**Câu chữ** (`texts`)
- [ ] `quote` — câu trích dẫn của hai bạn

**Backend**
- [ ] `backend.appsScriptUrl` — URL Web App (mục 4)
- [ ] `backend.rsvpDeadline` — hạn xác nhận tham dự
- [ ] Xóa 2 khách mẫu (`bac-hung`, `ban-lan`) trong sheet `KhachMoi` khi dùng thật
