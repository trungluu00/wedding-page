# Thiệp cưới online — Lưu Viết Trung & Đoàn Phương Nhi (hướng B)

Trang tĩnh (HTML + CSS + JS thuần, Bootstrap 5), mở tốt trong Zalo/Messenger trên điện thoại.
Toàn bộ nội dung và màu sắc nằm trong **một file**: [`wedding.config.js`](wedding.config.js).
Xác nhận tham dự (RSVP) và lời chúc lưu vào **Google Sheet** qua Google Apps Script.

Dựng từ mẫu mã nguồn mở [dewanakl/undangan](https://github.com/dewanakl/undangan) bản **v3.14.0** (giấy phép MIT, xem [`LICENSE`](LICENSE)).

## Chạy thử trên máy

Cần Node.js 18 trở lên.

```bash
cd huong-b
npm install
npm run dev
```

Mở http://localhost:8080. Thử thêm:

- http://localhost:8080/?to=bac-hung → bìa ghi "Kính mời **Bác Hùng**", khách nhà trai (thấy Lễ Thành Hôn + Tiệc cưới)
- http://localhost:8080/?to=co-lan → "Cô Lan", khách nhà gái (thấy Lễ Vu Quy + Tiệc cưới)
- http://localhost:8080/?to=Anh%20Nam → mã không có trong danh sách nhưng trông như tên người thì hiện đúng chữ đó

Khi `backend.appsScriptUrl` để trống, thiệp chạy **chế độ demo**: tra khách dùng dữ liệu mẫu ở
`js/connection/apps-script.js`, RSVP và lời chúc lưu trong localStorage của trình duyệt (xóa dữ liệu trang là mất).

Sửa `wedding.config.js`, `src/index.html` hoặc ảnh thì `npm run dev` tự build lại, chỉ cần tải lại trang.

## Build để deploy

```bash
npm run build
```

Kết quả nằm trong `public/` (không commit thư mục này). Build sẽ:

- ghi `<title>`, `description`, `og:title`, `og:description`, `og:image` (URL tuyệt đối từ `site.domain`) vào HTML, vì Zalo/Facebook không chạy JavaScript khi tạo ảnh xem trước;
- tính bảng màu từ theme và ghi vào `<style>` trong `<head>`;
- nạp Google Fonts theo `theme.fonts`;
- gom JS/CSS bằng esbuild (target iOS 14+/Chrome 80+);
- chép `photos/`, `music/`, `assets/` và `_headers` (header bảo mật cho Cloudflare Pages).

## Cấu trúc

```
huong-b/
├─ wedding.config.js        ← SỬA FILE NÀY: tên, ngày, địa điểm, ảnh, màu, ngân hàng...
├─ photos/                  ← ảnh (đang là ảnh giữ chỗ "Ảnh cưới")
├─ music/                   ← nhạc nền (đang trống)
├─ assets/favicon.svg
├─ src/index.html           ← khung trang; build chèn <head> vào chỗ <!--@HEAD-->
├─ src/_headers             ← header bảo mật (CSP...) cho Cloudflare Pages
├─ css/                     ← guest.css, common.css (map màu sang Bootstrap), animation.css
├─ js/
│  ├─ guest.js              ← điểm vào
│  ├─ app/guest/guest.js    ← điều phối: màn tải → bìa → Mở thiệp → nội dung
│  ├─ app/guest/render.js   ← dựng các phần từ config
│  ├─ app/guest/forms.js    ← RSVP + lời chúc
│  ├─ app/guest/audio.js, progress.js
│  ├─ connection/apps-script.js ← client Google Apps Script (+ chế độ demo)
│  ├─ common/               ← util, format (ngày VN, Calendar, VietQR), theme, storage, offline
│  └─ libs/                 ← nạp AOS/confetti, hiệu ứng confetti, helper Bootstrap
└─ scripts/
   ├─ build.mjs, dev.mjs
   ├─ theme.mjs             ← preset màu + trộn màu lúc build
   └─ make-placeholders.ps1 ← tạo lại ảnh giữ chỗ (npm run photos, cần Windows)
```

## Sửa nội dung

Mở `wedding.config.js`, sửa giá trị (đừng đổi tên khóa — khung này dùng chung với hướng A). Một số lưu ý:

- **Sự kiện** (`events`): `date` dạng `YYYY-MM-DD`, `time` dạng `HH:mm` theo giờ Việt Nam. `lunar` là chữ ghi sẵn (không tự tính âm lịch).
  `audience` quyết định ai thấy sự kiện: `"all"` = mọi khách; `"nha-trai"`, `"nha-gai"` hoặc tên nhóm bất kỳ khớp với cột `side`/`groups` của khách trong Sheet.
  Khách không có mã (`?to=` trống/sai) chỉ thấy sự kiện `"all"`. Đếm ngược và ngày trên bìa lấy sự kiện `"all"` sớm nhất.
- **Lời văn** (`texts`): `{khach}` được thay bằng cách xưng hô, vd "Bác Hùng"; không có mã khách thì là "Quý khách".
- **Thứ tự các phần** (`sections`): đổi thứ tự hoặc xóa tên để ẩn phần đó. `cover` là bìa thư "Mở thiệp" (chạm vào mới bật nhạc).
- **Ảnh** (`photos`, `album`): đặt file vào `photos/` rồi sửa đường dẫn. Nên nén ảnh JPG/WebP dưới ~300 KB mỗi ảnh. Ảnh chia sẻ `site.ogImage` phải là **JPG 1200×630**.
  `album.leaves` ở hướng B được trải thành một album trượt (front rồi back của từng lá).
  `photos.middle` được chèn lần lượt sau các phần couple → countdown → gifts → schedule (phần nào có trước thì chèn trước).
- **Nhạc** (`music.src`): vd `"music/bai-hat.mp3"` (nên < 3 MB). Để trống = không có nút nhạc.
- **Mừng cưới** (`gifts`): `bankBin` là mã BIN 6 số của ngân hàng (Vietcombank 970436, Techcombank 970407, MB 970422, VPBank 970432, BIDV 970418, VietinBank 970415, ACB 970416, TPBank 970423…).
  QR tạo từ `https://img.vietqr.io/image/{bankBin}-{accountNo}-compact2.png` với nội dung chuyển khoản "Mung cuoi {tên khách}" (không dấu, ≤ 50 ký tự). Có QR sẵn thì điền `qrImage`. Khách nhà gái thấy tài khoản nhà gái trước.

## Đổi theme

Trong `theme`:

```js
preset: "luc-bao",   // "luc-bao" | "xo-thom" | "navy" | "xanh-bui"
colors: { primary: null, accent: null, background: null, surface: null, text: null },
```

- Chỉ đổi `preset` là đủ. Muốn chỉnh riêng màu nào thì điền mã `#rrggbb` vào `colors` (null = theo preset).
- Từ 5 màu gốc, build tự tính (không dùng `color-mix()` để chạy được iOS 15):
  `strong` = primary pha 35% text, `soft` = primary pha 85% background, `muted` = text pha 30% background,
  `line` = text pha 85% background, `onPrimary` = trắng hoặc text (cái nào tương phản hơn).
  Tất cả thành biến CSS `--c-primary --c-accent --c-bg --c-surface --c-text --c-strong --c-soft --c-muted --c-line --c-on-primary` (+ `--c-*-rgb`) và được map sang biến Bootstrap (`--bs-primary`, `--bs-body-bg`…).
- Nút sáng/tối của template được giữ; bảng màu tối cũng suy ra từ cùng 5 màu. Mặc định luôn mở ở giao diện sáng.
- `fonts`: tên font Google Fonts, **phải có tiếng Việt** (Playfair Display, Be Vietnam Pro, Great Vibes, Lora, Cormorant Garamond, Dancing Script… đều có).
- `ornament`: `"song-hy"` (chữ 囍), `"monogram"` (T&N) hoặc `"none"`.

## Nối Google Sheet (Apps Script)

File `Code.gs` do **hướng A** viết. Sau khi deploy Apps Script thành Web App (Execute as: Me, Who has access: Anyone), dán URL dạng `https://script.google.com/macros/s/…/exec` vào:

```js
backend: { appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec", rsvpDeadline: "2026-12-31", maxGuestsPerInvite: 4 },
```

Thiệp gọi theo hợp đồng chung:

| Gọi | Gửi | Nhận |
| --- | --- | --- |
| `GET ?action=lookup&code=bac-hung` | | `{success, found, data:{code,name,xungHo,side,groups}}` |
| `GET ?action=wishes` | | `{success, data:[{author,relation,text,createdAt}]}` |
| `POST` (`Content-Type: text/plain`, thân JSON) | `{action:"rsvp", code, name, side, willAttend, guestCount, notes, hp}` | `{success, message?}` |
| `POST` | `{action:"wish", code, author, relation, text, hp}` | `{success, message?}` |
| `POST` | `{action:"open", code}` (một lần mỗi phiên khi khách bấm Mở thiệp) | `{success}` |

- `hp` là ô ẩn bẫy bot, người thật luôn gửi rỗng — Apps Script nên bỏ qua bản ghi có `hp` khác rỗng.
- Gửi bằng `text/plain` để không phát sinh preflight CORS.
- Tên hiển thị = `xungHo + " " + name`; nếu `name` đã bắt đầu bằng xưng hô (vd "Bác Hùng") thì không lặp.
- Link gửi khách: `https://<domain>/?to=<code>`.

## Deploy Cloudflare Pages

1. Đẩy repo lên GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → chọn repo.
3. Cấu hình build:
   - **Root directory**: `huong-b`
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `public`
   - Biến môi trường `NODE_VERSION` = `20`
4. Deploy, lấy địa chỉ (vd `https://trung-nhi.pages.dev`), điền vào `site.domain` rồi deploy lại để ảnh xem trước trên Zalo/Facebook có URL tuyệt đối.
5. Kiểm tra ảnh xem trước bằng [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (Zalo dùng cùng thẻ `og:*`, có cache — đổi ảnh thì đổi tên file).

`src/_headers` đặt CSP và vài header bảo mật cơ bản. Nếu dùng ảnh/nhạc từ nơi khác (Cloudinary, Google Drive…) thì `img-src`/`media-src` đã cho phép mọi `https:`; nếu gọi API khác ngoài Apps Script thì thêm vào `connect-src`.
Vercel: không đọc `_headers`; cấu hình tương tự trong `vercel.json` nếu cần.

## Khác biệt so với template gốc

- Việt hóa toàn bộ; bỏ nội dung Hồi giáo/Indonesia, câu chuyện tình, video, dress code, ảnh/nhạc/tên mẫu.
- Nội dung không viết cứng trong `index.html` nữa mà dựng từ `wedding.config.js` (mọi chuỗi qua `textContent`).
- Bỏ API PHP (dewanakl/undangan-api), bình luận/like/GIF/trang admin `dashboard.html`; thay bằng RSVP + lời chúc qua Apps Script, có chế độ demo.
- `?to=` là **mã khách** tra trong Sheet (có xưng hô, phía, nhóm) thay vì tên thô; sự kiện lọc theo nhóm.
- Thêm: ngày âm lịch, Google Calendar theo từng sự kiện, nút Chỉ đường, lịch trình, QR VietQR tách nhà trai/nhà gái + nút chép số tài khoản, ảnh xem trước Zalo/Facebook ghi lúc build.
- Theme: bỏ màu cứng đen/trắng, dùng 10 biến màu tính lúc build, 4 preset.
- Màn tải không bao giờ kẹt: ảnh/thư viện lỗi vẫn mở thiệp, tối đa chờ 10 giây (bản gốc tô đỏ và dừng).
- Hiệu ứng mờ dần tính theo thời gian thực (webview trong app hay hãm `requestAnimationFrame`).
- Nạp AOS/confetti/nhạc trực tiếp thay vì qua Cache API; thông báo bằng toast thay `alert()`; chép có phương án dự phòng cho webview.
- Bỏ eslint/stylelint/htmlhint/madge; chỉ còn esbuild (0.25, đã vá lỗi dev server của 0.24).

File giữ gần nguyên từ template: `LICENSE`, `css/animation.css`, `js/libs/bootstrap.js`. Các file JS còn lại được viết lại dựa trên cấu trúc của template (ghi chú ở đầu mỗi file).

## Các trường còn TODO

Tất cả nằm trong `wedding.config.js` (tìm chữ `TODO`):

- `site.domain`, `site.description`, ảnh chia sẻ `site.ogImage`
- `couple.groom` / `couple.bride`: `portrait`, `bio`, `phone`, `father`, `mother`, `address`
- `events`: ngày, giờ, **âm lịch (cần kiểm tra lại)**, nơi tổ chức, địa chỉ, link Google Maps của cả 3 sự kiện; thêm/bớt sự kiện nếu khác
- `schedule`: giờ và tên các mục
- `gifts.accounts`: ngân hàng, mã BIN, số tài khoản, tên chủ tài khoản (hiện là số giả)
- `photos.*`, `album.leaves`: toàn bộ ảnh đang là ảnh giữ chỗ
- `music`: file nhạc, tên bài, ca sĩ
- `texts`: câu trích dẫn, lời mời, lời cảm ơn
- `backend.appsScriptUrl` (lấy từ hướng A), `backend.rsvpDeadline`
