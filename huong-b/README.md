# Thiệp cưới online — Lưu Viết Trung & Đoàn Phương Nhi (hướng B)

Trang tĩnh (HTML + CSS + JS thuần, Bootstrap 5), mở tốt trong Zalo/Messenger trên điện thoại.
Toàn bộ nội dung và màu sắc nằm trong **một file**: [`wedding.config.js`](wedding.config.js).
Xác nhận tham dự (RSVP) và lời chúc lưu vào **Google Sheet** qua Google Apps Script.

Dựng từ mẫu mã nguồn mở [dewanakl/undangan](https://github.com/dewanakl/undangan) bản **v3.14.0** (giấy phép MIT, xem [`LICENSE`](LICENSE)).

**Đây là phương án đang chạy trên trang thật <https://trung-nhi.vercel.app>** (Vercel build từ thư mục gốc
của repo, xem mục *Deploy* bên dưới). Khách mời đã dùng thiệp: push lên `main` là trang thật đổi theo.

## Chạy thử trên máy

Cần Node.js 18 trở lên.

```bash
cd huong-b
npm install
npm run dev
```

(hoặc từ thư mục gốc: `npm run dev:b`). Mở http://localhost:8080. Thử thêm:

- http://localhost:8080/?ben=nha-trai → thiệp nhà trai (lời mời "lễ thành hôn", thấy bữa cơm nhà trai + Lễ Thành Hôn)
- http://localhost:8080/?ben=nha-gai → thiệp nhà gái (lời mời "lễ vu quy", cô dâu đứng trước, thấy bữa cơm nhà gái + Lễ Vu Quy)
- http://localhost:8080/?to=Anh%20Nam → mã không có trong danh sách nhưng trông như tên người thì hiện đúng chữ đó

> **Lưu ý:** `backend.appsScriptUrl` đang nối **Google Sheet thật**. Khi chạy thử, bấm "Gửi xác nhận" hay
> "Gửi lời chúc" là ghi thẳng vào Sheet (lời chúc hiện cho mọi khách); mở link `?to=<mã khách thật>` rồi bấm
> "Mở thiệp" là ghi một dòng vào `LuotMo`. Muốn thử gửi form thì tạm xóa `appsScriptUrl` (đừng commit).

Khi `backend.appsScriptUrl` để trống, thiệp chạy **chế độ demo**: tra khách dùng dữ liệu mẫu ở
`js/connection/apps-script.js` (`?to=bac-hung-7k2` → "Bác Hùng", nhà trai; `?to=ban-lan-3x9` → "Bạn Lan", nhà gái),
RSVP và lời chúc lưu trong localStorage của trình duyệt (xóa dữ liệu trang là mất).

Sửa `wedding.config.js`, `src/index.html` hoặc ảnh thì `npm run dev` tự build lại, chỉ cần tải lại trang.

## Build để deploy

```bash
npm run build
```

Kết quả nằm trong `public/` (không commit thư mục này). Build sẽ:

- ghi `<title>`, `description`, `og:title`, `og:description`, `og:image` (URL tuyệt đối từ `site.domain`) vào HTML, vì Zalo/Facebook không chạy JavaScript khi tạo ảnh xem trước;
- tính bảng màu từ theme và ghi vào `<style>` trong `<head>`;
- nạp Google Fonts theo `theme.fonts`;
- gom JS/CSS bằng esbuild (target iOS 14+/Chrome 80+); `wedding.config.js` được gói vào JS nhưng **bỏ
  `photos.source`** (đường dẫn thư mục ảnh gốc trên máy) để không lộ ra file công khai;
- chép `photos/` (trừ `manifest.json`, `sizes.json`), `assets/`, nhạc (`huong-b/music/` nếu có, không thì
  `../public/music/` dùng chung với phương án A) và `_headers` (chỉ Cloudflare Pages đọc file này).

Từ thư mục gốc, `npm run build` (khi `phuongAn: "b"`) chạy build này rồi chép `huong-b/public/` sang `dist/`.

## Cấu trúc

```
huong-b/
├─ wedding.config.js        ← SỬA FILE NÀY: tên, ngày, địa điểm, ảnh, màu, ngân hàng...
├─ photos/w/                ← ảnh đã nén: pNN-{2560,1600,900,400}.webp (do npm run photos sinh)
├─ photos/share-1200x630.jpg ← ảnh xem trước Zalo/Facebook
├─ photos/manifest.json     ← mã ảnh ↔ tên file gốc (không deploy); photos/sizes.json: bản gọn gói vào JS
├─ photos-contact-sheet.html ← bảng xem toàn bộ ảnh + mã để chọn (không deploy)
├─ (music/)                 ← không có: nhạc lấy từ ../public/music/ (dùng chung với phương án A)
├─ assets/favicon.svg
├─ src/index.html           ← khung trang; build chèn <head> vào chỗ <!--@HEAD-->
├─ src/_headers             ← header bảo mật cho Cloudflare Pages (trang thật trên Vercel dùng ../vercel.json)
├─ css/                     ← guest.css, common.css (map màu sang Bootstrap), animation.css
├─ js/
│  ├─ guest.js              ← điểm vào
│  ├─ app/guest/guest.js    ← điều phối: màn tải → bìa → Mở thiệp → nội dung
│  ├─ app/guest/render.js   ← dựng các phần từ config
│  ├─ app/guest/forms.js    ← RSVP + lời chúc
│  ├─ app/guest/wish-ticker.js ← lời chúc hiện lần lượt trên đầu thiệp sau khi mở
│  ├─ app/guest/audio.js, progress.js
│  ├─ connection/apps-script.js ← client Google Apps Script (+ chế độ demo)
│  ├─ common/               ← util, format (ngày VN, Calendar, VietQR), theme, storage, offline
│  └─ libs/                 ← nạp AOS/confetti, hiệu ứng confetti, helper Bootstrap
└─ scripts/
   ├─ build.mjs, dev.mjs
   ├─ theme.mjs             ← preset màu + trộn màu lúc build
   └─ photos.mjs            ← xử lý ảnh gốc bằng sharp (npm run photos)
```

## Sửa nội dung

Mở `wedding.config.js`, sửa giá trị (đừng đổi tên khóa — khung này dùng chung với hướng A). Một số lưu ý:

- **Sự kiện** (`events`): `date` dạng `YYYY-MM-DD`, `time` dạng `HH:mm` theo giờ Việt Nam. `lunar` là chữ ghi sẵn (không tự tính âm lịch; tính bằng `npm run lunar -- YYYY-MM-DD` ở thư mục gốc).
  **Giờ thật đọc từ Google Sheet** (`CauHinh`, nhóm *GIỜ SỰ KIỆN*) mỗi lần mở thiệp; `time` trong config chỉ là dự phòng khi Sheet không trả lời trong 4 giây.
  `audience` quyết định ai thấy sự kiện: `"all"` = mọi người; `"nha-trai"`, `"nha-gai"`, `"ban-chung"` hoặc tên nhóm bất kỳ khớp với cột `side`/`groups` của khách trong Sheet (link `?ben=nha-trai` / `?ben=nha-gai` tính như khách nhà đó);
  `"public"` = người mở link không có mã khách (hoặc mã không có trong Sheet) và không có `?ben=`.
  Đếm ngược, ngày trên bìa và nút "Lưu vào lịch" lấy sự kiện `main: true` sớm nhất trong số khách được thấy.
- **Lời văn** (`texts`): `{khach}` được thay bằng cách xưng hô, vd "Bác Hùng"; không có mã khách thì là "Quý vị".
  `texts.bySide["nha-trai" | "nha-gai"]` ghi đè lời mời / dòng trên bìa cho thiệp từng nhà.
  Câu trích (`quote`) và giới thiệu cô dâu chú rể (`couple.*.bio`) sửa được trong Sheet (`CauHinh`, nhóm *LỜI TRÊN THIỆP*); ô trống thì dùng lời trong config.
- **Thứ tự các phần** (`sections`): đổi thứ tự hoặc xóa tên để ẩn phần đó. `cover` là bìa thư "Mở thiệp" (chạm vào mới bật nhạc).
- **Ảnh** (`photos`, `album`, `couple.*.portrait`): ghi **mã ảnh** `pNN` hoặc mã ảnh cắt trong `photos.crops` (xem `photos-contact-sheet.html`). `photos.cover` là ảnh trong khung vòm ở bìa thư, `photos.hero` là ảnh lớn đầu thiệp sau khi mở. Thiệp tự dùng `srcset` để điện thoại tải cỡ vừa đủ mà vẫn nét trên màn hình retina; chạm ảnh mở bản 2560 px. Vẫn ghi được đường dẫn thường như `"photos/abc.jpg"`.
  `photos.shareFrom` là ảnh dùng để cắt ảnh chia sẻ 1200×630 (`sharePosition`: `"center"` hoặc `"attention"`); chạy lại `npm run photos` sau khi đổi.
  `album.kicker` / `album.title`: dòng chữ nhỏ và tiêu đề của album.
  `album.leaves` ở hướng B được trải thành một album trượt (front rồi back của từng lá).
  `photos.middle` được chèn lần lượt sau các phần couple → countdown → gifts → rsvp → schedule (chỉ phần đang hiện; phần nào có trước thì chèn trước).
  `photos.desktop`: các ảnh trình chiếu ở cột trái trên màn hình máy tính (đổi ảnh mỗi 6 giây).
- **Nhạc** (`music.src`): vd `"music/bai-hat.mp3"` (nên < 3 MB). Để trống = không có nút nhạc.
- **Mừng cưới** (`gifts`): **tài khoản thật điền trong Google Sheet** (`CauHinh`, nhóm *MỪNG CƯỚI*: ngân hàng, số tài khoản, tên chủ tài khoản, link ảnh QR riêng) và thay hẳn cho `gifts.accounts` trong config. Config cố ý chỉ có số giữ chỗ: không nối được Sheet thì mục Mừng cưới tự ẩn; thiếu ngân hàng (và không có ảnh QR riêng) thì tài khoản đó cũng ẩn — không bao giờ hiện QR sai.
  QR tạo từ `https://img.vietqr.io/image/{bankBin}-{accountNo}-compact2.png` với nội dung chuyển khoản "Mung cuoi {tên khách}" (không dấu, ≤ 50 ký tự). Có ảnh QR riêng (vd Google Drive, chia sẻ "Bất kỳ ai có đường liên kết") thì dùng ảnh đó; ảnh lỗi thì tự quay về VietQR. Khách nhà gái thấy tài khoản nhà gái trước.

## Ảnh cưới (chất lượng cao)

Ảnh gốc **không** nằm trong repo. Lệnh sau đọc thư mục ảnh gốc và xuất ảnh web vào `photos/w/`:

```bash
npm run photos                                   # thư mục lấy từ photos.source trong config
PHOTO_SOURCE="D:/anh-cuoi" npm run photos         # hoặc chỉ định bằng biến môi trường
```

- **Chỉ ảnh đang được config dùng** mới được xuất; đổi/bỏ ảnh trong config rồi chạy lại thì file ảnh không còn dùng bị xóa khỏi `photos/w/`. Mã `pNN` của mọi ảnh gốc vẫn được giữ cố định trong `photos/manifest.json`.
- Mỗi ảnh ra 4 cỡ WebP theo cạnh dài: **2560** (xem phóng to), **1600** (hiển thị), **900** (điện thoại), **400** (thumbnail). Chất lượng 88, `smartSubsample`, không phóng to: ảnh/vùng cắt nhỏ hơn cỡ đích thì bỏ cỡ đó.
- `photos.crops`: ảnh cắt từ một vùng của ảnh gốc (tỉ lệ 0..1), vd `"p35-chu-re"` / `"p35-co-dau"` là chân dung chú rể / cô dâu cắt từ p35 (vùng cắt nhỏ hơn 2560 px nên chỉ có cỡ 1600/900/400).
- Xoay theo EXIF, chuyển về sRGB, **bỏ toàn bộ EXIF/GPS**.
- Ảnh chia sẻ `photos/share-1200x630.jpg`: JPEG q90, 4:4:4.
- Hiện tại: 24 ảnh cưới (thư mục "Ảnh phóng" + "Ảnh con") + 2 ảnh cắt chân dung, `photos/w` 102 file ≈ 17 MB. Khách trên điện thoại chỉ tải cỡ 900/1600 và thumbnail 400 cho album; bản 2560 chỉ tải khi chạm xem ảnh.
- `photos.source` đang trỏ tới thư mục trên máy đã xử lý ảnh; máy khác thì đặt `PHOTO_SOURCE` trỏ tới bản sao thư mục ảnh gốc.
- `.gitignore` chặn các kiểu file ảnh gốc (`IMG_*.jpg`, tên có dấu `+`, RAW, HEIC).

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

**Đã nối xong** (Sheet và Web App xem mục 4 của [`../README.md`](../README.md)). Backend là
[`../apps-script/Code.gs`](../apps-script/Code.gs), dùng chung cho hai phương án. Cài lại trên Sheet khác: deploy Apps Script
thành Web App (Execute as: Me, Who has access: Anyone), dán URL dạng `https://script.google.com/macros/s/…/exec` vào:

```js
backend: { appsScriptUrl: "https://script.google.com/macros/s/XXXX/exec", rsvpDeadline: "2026-12-02", maxGuestsPerInvite: 4 },
```

Thiệp gọi theo hợp đồng chung:

| Gọi | Gửi | Nhận |
| --- | --- | --- |
| `GET ?action=lookup&code=bac-hung-7k2` | | `{success, found, data:{code,name,xungHo,side,groups}}` |
| `GET ?action=wishes` | | `{success, data:[{author,relation,text,createdAt}]}` (chỉ lời chúc có tick cột **Hiện**) |
| `GET ?action=settings` | | `{success, data:{events:{<id>:{time}}, accounts:[…], texts:{quote,groomBio,brideBio}}}` (sheet `CauHinh`) |
| `POST` (`Content-Type: text/plain`, thân JSON) | `{action:"rsvp", code, name, side, willAttend, guestCount, notes, hp}` | `{success, message?}` |
| `POST` | `{action:"wish", code, author, relation, text, hp}` | `{success, message?}` |
| `POST` | `{action:"open", code}` (một lần mỗi phiên khi khách bấm Mở thiệp) | `{success}` |

- `hp` là ô ẩn bẫy bot, người thật luôn gửi rỗng — Apps Script nên bỏ qua bản ghi có `hp` khác rỗng.
- Gửi bằng `text/plain` để không phát sinh preflight CORS.
- Tên hiển thị = `xungHo + " " + name`; nếu `name` đã bắt đầu bằng xưng hô (vd "Bác Hùng") thì không lặp.
- Link gửi khách (cột `link` trong sheet `KhachMoi` tự ghép): `https://<domain>/?to=<code>&n=<tên có dấu>`;
  `n=` để thiệp hiện đúng tên ngay cả khi chưa tra được Sheet. Link chung theo nhà: `?ben=nha-trai` / `?ben=nha-gai`
  (ô B3/B4 của `CauHinh`).
- Ô **Họ và tên** ở phần Xác nhận tham dự và Lời chúc được điền sẵn tên khách trong link mời (tra Sheet được thì là
  xưng hô + tên như trên bìa, vd "Bác Hùng"; chưa tra được thì lấy `n=`); khách sửa được. Tên khách đã tự gõ ở form
  này được điền sang form kia (chỉ với cùng link mời trên cùng máy). Sheet chậm/lỗi lúc tra mã thì xác nhận vẫn gửi
  kèm mã trong link, nên cột `rsvpStatus` / `guestCount` của khách vẫn được cập nhật.

## Deploy (Vercel — trang thật)

Trang thật chạy trên Vercel, dự án `trung-nhi`, nối với repo GitHub (chi tiết ở mục 6 của [`../README.md`](../README.md)):

- Vercel build từ **thư mục gốc** của repo theo [`../vercel.json`](../vercel.json): `npm run build` → vì
  `phuongAn: "b"` trong `../wedding.config.js` nên chạy build của thư mục này rồi chép `public/` sang `dist/`.
- **Mỗi lần push lên `main` là trang thật tự cập nhật** sau khoảng 1 phút — chạy thử trên máy trước khi push.
- Header bảo mật (CSP…) nằm trong `../vercel.json`, **không** phải `src/_headers`. Thêm dịch vụ ngoài mới (ảnh,
  script, API) thì thêm tên miền vào `Content-Security-Policy` trong `../vercel.json`.
- Đổi ảnh chia sẻ thì kiểm tra lại bằng [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  (Zalo dùng cùng thẻ `og:*`, có cache — đổi ảnh thì đổi tên file).

Dự phòng — deploy riêng thư mục này lên Cloudflare Pages: Root directory `huong-b`, Build command
`npm install && npm run build`, Build output directory `public`, biến môi trường `NODE_VERSION` = `20`.
Cloudflare đọc header từ `src/_headers` (được chép vào `public/` khi build); khi đó nhạc phải nằm trong
`huong-b/music/` vì thư mục gốc không được tải lên.

## Khác biệt so với template gốc

- Việt hóa toàn bộ; bỏ nội dung Hồi giáo/Indonesia, câu chuyện tình, video, dress code, ảnh/nhạc/tên mẫu.
- Nội dung không viết cứng trong `index.html` nữa mà dựng từ `wedding.config.js` (mọi chuỗi qua `textContent`).
- Bỏ API PHP (dewanakl/undangan-api), bình luận/like/GIF/trang admin `dashboard.html`; thay bằng RSVP + lời chúc qua Apps Script, có chế độ demo.
- `?to=` là **mã khách** tra trong Sheet (có xưng hô, phía, nhóm) thay vì tên thô; sự kiện lọc theo nhóm.
- Thêm: ngày âm lịch, Google Calendar theo từng sự kiện, nút Chỉ đường, lịch trình, QR VietQR tách nhà trai/nhà gái + nút chép số tài khoản, ảnh xem trước Zalo/Facebook ghi lúc build.
- Theme: bỏ màu cứng đen/trắng, dùng 10 biến màu tính lúc build, 4 preset.
- Màn tải không bao giờ kẹt: ảnh/thư viện lỗi vẫn mở thiệp, tối đa chờ 10 giây (bản gốc tô đỏ và dừng).
- Hiệu ứng mờ dần tính theo thời gian thực (webview trong app hay hãm `requestAnimationFrame`).
- Nạp AOS/confetti/nhạc trực tiếp thay vì qua Cache API; chép có phương án dự phòng cho webview.
- Thông báo: một toast duy nhất thay cho `alert()`, thông báo mới thay thông báo cũ (hủy timer cũ), nằm trên thanh điều hướng dưới (tính cả vùng an toàn iPhone), chỉ chuyển động `transform`/`opacity`.
- Chuyển động nhẹ: confetti vẽ bằng Web Worker trên canvas riêng, 3,5 giây rồi tự gỡ, dừng khi ẩn tab; bỏ `backdrop-filter` ở thanh điều hướng và nút nổi; mờ dần bằng CSS transition; tôn trọng "giảm chuyển động". Lời chúc mới chèn lên đầu danh sách có hiệu ứng, trang không nhảy.
- Bìa thư nền màu chính, 囍 vàng đồng, nút "Mở thiệp" vàng đồng như trang chọn theme; mọi phần nền kem, thẻ trắng.
- Album: lưới ảnh 3 cột (12 ảnh đầu + "Xem thêm"), lightbox có nút trước/sau, vuốt, phím mũi tên, tải bản 2560 px.
- Bỏ eslint/stylelint/htmlhint/madge; chỉ còn esbuild (0.25, đã vá lỗi dev server của 0.24).

File giữ gần nguyên từ template: `LICENSE`, `css/animation.css`, `js/libs/bootstrap.js`. Các file JS còn lại được viết lại dựa trên cấu trúc của template (ghi chú ở đầu mỗi file).

## Tình trạng nội dung (25/11/2026)

Thiệp đã đủ nội dung thật và đang được khách dùng. Không còn mục `TODO` trong `wedding.config.js`.

| Mục | Ở đâu | Tình trạng |
| --- | --- | --- |
| Tên, bố mẹ, địa chỉ, SĐT, tên miền, lời mời theo từng nhà | `wedding.config.js` | Xong (theo thiệp in) |
| Sự kiện 12/12 và 13/12, âm lịch, chỉ đường, `audience` | `wedding.config.js` | Xong |
| Giờ sự kiện (bữa cơm nhà trai 15:00, nhà gái 16:00, Vu Quy 06:00, Thành Hôn 10:00) | Sheet `CauHinh` (config chỉ dự phòng) | Xong |
| Tài khoản mừng cưới (chú rể TPBank + ảnh QR riêng, cô dâu MB Bank) | Sheet `CauHinh` | Xong — ảnh QR riêng của cô dâu trên Drive đang không tải được, thiệp tự dùng VietQR; muốn hiện ảnh riêng thì chia sẻ file đó "Bất kỳ ai có đường liên kết" |
| Câu trích, giới thiệu cô dâu chú rể | Sheet `CauHinh` (ô trống → lời trong config) | Xong |
| Ảnh (24 ảnh cưới + 2 chân dung cắt), ảnh chia sẻ | `photos/` | Xong |
| Nhạc "Beautiful in White" | `../public/music/` | Xong |
| Lời chúc | Sheet `LoiChuc` | Đã có lời chúc thật; lời chúc mẫu không còn hiện |
| Hạn xác nhận tham dự | `backend.rsvpDeadline` = `2026-12-02` | Xong |
| Lịch trình (`schedule`) | `wedding.config.js` | Đã khớp với sự kiện; phần này đang tắt (không có trong `sections`) |
