# Thiệp cưới online — Lưu Viết Trung & Đoàn Phương Nhi

Trang thiệp cưới tĩnh, có **2 phương án giao diện** dùng chung một Google Sheet:

| Phương án | Giao diện | Thư mục / cấu hình |
|---|---|---|
| **A** | "Song Hỷ Xanh": bìa thư, album lật trang 3D, lời chúc bay, nhạc chạy lời, bắn tim | thư mục gốc · [`wedding.config.js`](wedding.config.js) |
| **B** (**trang thật đang chạy**) | dựa trên dewanakl/undangan (MIT): cuộn dọc, lưới ảnh, chế độ sáng/tối | [`huong-b/`](huong-b/) · [`huong-b/wedding.config.js`](huong-b/wedding.config.js) |

**Trang thật <https://trung-nhi.vercel.app> đang chạy phương án B** (`phuongAn: "b"` trong `wedding.config.js`)
và khách mời đã dùng thiệp (đã có lời chúc thật). Mỗi lần push lên `main` là trang thật đổi theo — chạy thử
trên máy trước khi push. Nội dung hay đổi (giờ sự kiện, tài khoản mừng cưới, câu trích, giới thiệu cô dâu chú rể)
sửa trong Google Sheet, không cần build lại (mục 4).

**Chọn phương án:** sửa `phuongAn: "a"` hoặc `"b"` ở đầu `wedding.config.js`, rồi `npm run dev` / `npm run build`.
Hoặc chọn khi chạy: `npm run dev:a`, `npm run dev:b`, `npm run build:a`, `npm run build:b`
(hay `PHUONG_AN=b npm run build`). Cả hai đều build ra `dist/` nên cách deploy giống nhau.
Thông tin thật (tên, bố mẹ, địa chỉ, SĐT, ngày cưới, sự kiện) đang giống nhau ở hai file cấu hình —
**sửa một bên thì nhớ sửa bên kia.** Phần dưới đây hướng dẫn phương án A; phương án B xem
[`huong-b/README.md`](huong-b/README.md) (ảnh của B xử lý bằng `npm run photos:b`).

- **Không có server riêng.** Build ra thư mục `dist/`, chạy trên Vercel (mục 6).
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

Phương án A mở ở http://localhost:5173, phương án B ở http://localhost:8080. Thử thiệp theo nhà:
`/?ben=nha-trai` và `/?ben=nha-gai` (lời mời, thứ tự cô dâu/chú rể và sự kiện đổi theo nhà). B hiểu thêm dạng ngắn
`/?t` và `/?g` — đây là link chung đang ghi ở ô B3/B4 của sheet `CauHinh`.

> **Lưu ý:** `backend.appsScriptUrl` đang nối **Google Sheet thật**. Khi chạy thử trên máy, bấm "Gửi xác nhận" hay
> "Gửi lời chúc" là ghi thẳng vào Sheet (lời chúc hiện cho mọi khách), mở link `?to=<mã khách thật>` rồi bấm
> "Mở thiệp" là ghi một dòng vào `LuotMo`. Muốn thử gửi form thì tạm xóa `appsScriptUrl` (đừng commit).

Khi `backend.appsScriptUrl` để trống, trang chạy **chế độ demo**: không gọi mạng, RSVP và lời chúc chỉ lưu
trong trình duyệt đang mở (Console có dòng thông báo "Chế độ demo"). Chế độ demo có hai khách mẫu:
`/?to=bac-hung-7k2` (khách nhà trai) và `/?to=ban-lan-3x9` (khách nhà gái).

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

**Sự kiện theo nhóm khách:** `audience: ["all"]` thì ai cũng thấy. `"nha-trai"` / `"nha-gai"` / `"ban-chung"`
khớp cột `side` của khách trong Sheet; `"public"` là người mở link không có mã khách; tên nhóm khác
(vd `"gia-dinh"`) khớp cột `groups`. Sự kiện có `main: true` dùng cho ngày lớn, lịch và đếm ngược.
Hiện thiệp chia (giống nhau ở A và B):

| Ai mở thiệp | Thấy các sự kiện |
|---|---|
| Khách nhà trai (`side` = `nha-trai`, hoặc link `?ben=nha-trai`; ở B cả `?t`) | Bữa cơm nhà trai (12/12) · Lễ Thành Hôn (13/12, 10:00) |
| Khách nhà gái (`side` = `nha-gai`, hoặc link `?ben=nha-gai`; ở B cả `?g`) | Bữa cơm nhà gái (12/12) · Lễ Vu Quy (13/12, 06:00) |
| Bạn chung (`side` = `ban-chung`) | Hai bữa cơm 12/12 |
| Link không có mã khách, hoặc khách trong Sheet chưa điền `side` (và `groups`) | Cả bốn sự kiện |

Nhớ điền cột `side` cho mọi khách trong `KhachMoi`: khách chưa có `side` thấy cả bốn sự kiện như link chung.
Mỗi sự kiện có thể thêm `note` (một dòng ghi chú in nghiêng), mỗi mốc lịch trình có thể thêm `day`.

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

**Đã cài xong** cho Trung & Nhi:

- Sheet: <https://docs.google.com/spreadsheets/d/1McYGSS9aSXYBzahcMkWl3GDR24vkHMZylKtDJGmz4_4/edit>
  (menu **💌 Thiệp cưới** trong Sheet: sinh code + link mời cho khách còn trống, thêm cột ô tick "Đã mời" /
  "Mời offline", tạo sheet còn thiếu)

> **Dữ liệu trong Sheet là thật** (khách mời, xác nhận, lời chúc). Script **chỉ thêm, không bao giờ sửa hay xóa**
> ô đã có chữ: chỉ ghi vào ô trống (code, link của khách mới), thêm dòng mới (xác nhận, lời chúc, lượt mở) và cập
> nhật `rsvpStatus` / `guestCount` khi chính khách đó gửi xác nhận. "Tạo sheet còn thiếu" chỉ tạo sheet bị mất,
> sheet đã có giữ nguyên. Các hàm thêm lời chúc mẫu / xóa khách mẫu đã bỏ khỏi script.
- Web App (đã điền vào `backend.appsScriptUrl` của cả A và B):
  `https://script.google.com/macros/s/AKfycbweK_k5I16ouNV189PTuKVvl_dJfq5KNAK6ltCqHaCRxO78p8huvzEPG4_42DN8FZfjVg/exec`

Các bước dưới đây chỉ cần khi cài lại từ đầu trên Sheet khác.

1. Tạo một Google Sheet mới (vd "Thiệp cưới Trung Nhi").
2. Menu **Tiện ích mở rộng → Apps Script**. Xóa code mẫu, dán toàn bộ nội dung [`apps-script/Code.gs`](apps-script/Code.gs), bấm Lưu.
3. Chọn hàm `setupDatabase` ở thanh trên → **Chạy**. Lần đầu Google hỏi quyền: chọn tài khoản →
   "Advanced / Nâng cao" → "Go to … (unsafe)" → Cho phép. Script tạo các sheet:
   - `CauHinh`: ô **B1** điền tên miền thiệp, vd `https://trung-nhi.vercel.app` (không có `/` ở cuối).
   - `KhachMoi`: danh sách khách (code, name, xungHo, side, groups, phone, notes, link, rsvpStatus, guestCount;
     tùy chọn thêm hai cột ô tick **Đã mời**, **Mời offline** ở đầu — mục 5). Script tìm cột theo **chữ ở dòng tiêu đề**, nên chèn /
     đổi chỗ cột không sao, nhưng đừng sửa chữ tiêu đề.
   - `RSVP`, `LoiChuc` (cột **Hiện**: bỏ tick để ẩn một lời chúc), `LuotMo` (ai đã mở thiệp).
4. **Triển khai → Tùy chọn triển khai mới** → biểu tượng bánh răng → **Ứng dụng web**:
   - Thực thi với tư cách: **Tôi**
   - Người có quyền truy cập: **Bất kỳ ai** (Anyone)
   - Bấm Triển khai, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).
5. Dán URL vào `backend.appsScriptUrl` trong `wedding.config.js`, build và deploy lại.
6. Kiểm tra: mở `URL/exec?action=lookup&code=bac-hung-7k2` trên trình duyệt phải thấy `"found":true`.

Script tự tạo lại sheet nếu bị xóa nhầm (sheet còn lại giữ nguyên), và tự chọn dấu `,` hoặc `;` cho công thức
theo ngôn ngữ của Sheet (Sheet tiếng Việt dùng `;`).

Khi sửa `Code.gs` sau này: dán bản mới vào trình soạn Apps Script, **Lưu**, rồi **Triển khai → Quản lý triển
khai → sửa (bút chì) → Phiên bản: Mới → Triển khai** để giữ nguyên URL. Không cần chạy lại `setupDatabase`.
Menu và việc tự sinh code / link dùng bản vừa Lưu ngay; còn thiệp (tra khách, gửi xác nhận, lời chúc) chỉ dùng
bản mới sau khi Triển khai.

**Bảo mật mức cơ bản:** lookup chỉ trả về đúng một khách theo mã; dữ liệu khách nhập được giới hạn độ dài
(tên ≤ 80, lời chúc ≤ 500, số người 0–10), có ô bẫy bot, khóa ghi đồng thời, và chặn chuỗi bắt đầu bằng `=`
bị Sheets hiểu là công thức. Ai có link Web App đều gửi được RSVP/lời chúc — đây là đánh đổi chấp nhận được
cho thiệp cưới. Muốn ẩn lời chúc không phù hợp: bỏ tick cột **Hiện** (trang cập nhật sau tối đa 60 giây).

## 5. Tạo link mời riêng cho từng khách

1. Trong sheet `KhachMoi`, mỗi khách một dòng:
   - `name`: tên gọi (vd `Hùng`), `xungHo`: cách xưng (vd `Bác`) → bìa thiệp hiện "Kính mời Bác Hùng".
   - `side`: `nha-trai` / `nha-gai` / `ban-chung` (chọn từ danh sách).
   - `groups`: nhóm, cách nhau dấu phẩy (vd `gia-dinh`), dùng để hiện các sự kiện riêng.
   - `code`: để trống, script tự sinh từ xưng hô + tên (vd `bac-hung-7k2`) khi bạn nhập tên / xưng hô.
     Hoặc dùng menu **💌 Thiệp cưới → Sinh code + link mời cho khách còn trống**.
2. Cột `link` tự ghép link mời ngắn, vd `https://tên-miền/?t=bac-hung-7k2&n=B%C3%A1c+H%C3%B9ng` — sao chép gửi
   qua Zalo/Messenger.
   - **Tên tham số cho biết nhà của khách** (lấy từ cột `side`): `?t=` nhà trai, `?g=` nhà gái, `?c=` bạn chung,
     `?to=` chưa ghi nhà. Thiệp biết nhà ngay từ link: Sheet trả lời trong 2,5 giây thì dùng dữ liệu Sheet (chuẩn —
     sửa `side` sau khi gửi link thì thiệp vẫn theo Sheet), không kịp thì mở luôn theo link, không bao giờ hiện
     thông tin của cả hai nhà. Link không dài thêm, không lộ chữ "nhà trai/nhà gái".
   - `n=` là **tên có dấu** (xưng hô + tên, dấu cách viết `+`): thiệp hiện "Kính mời Bác Hùng" đúng dấu ngay khi
     mở, kể cả khi chưa nối được Sheet. Tên hiển thị không bao giờ bị "đoán" từ mã không dấu.
   - Link cũ dạng `?to=mã&n=…` đã gửi vẫn dùng được (thiệp tra Sheet để biết nhà, chờ tối đa 15 giây).
   - Link chung theo nhà (ô B3/B4 của `CauHinh`): `https://tên-miền/?t` (nhà trai) / `?g` (nhà gái);
     dạng cũ `?ben=nha-trai` / `?ben=nha-gai` vẫn dùng được.
   - Công thức ở ô tiêu đề cột link (Sheet tiếng Việt dùng `;`, cột C = code, D = name, E = xungHo, F = side):
     `={"link"; ARRAYFORMULA(IF(C2:C=""; ""; CauHinh!$B$1 & "/?" & IF(LOWER(TRIM(F2:F))="nha-trai"; "t"; IF(LOWER(TRIM(F2:F))="nha-gai"; "g"; IF(LOWER(TRIM(F2:F))="ban-chung"; "c"; "to"))) & "=" & C2:C & "&n=" & SUBSTITUTE(ENCODEURL(TRIM(E2:E & " " & D2:D)); "%20"; "+")))}`
   Link chỉ có khi dòng đó đã có `code`. Ban đầu cột `link` do công thức ở ô tiêu đề cột tự ghép; công thức này
   báo `#REF!` nếu trong cột link đã có chữ (vd dán cả khối khách kèm link đã sao chép, hay gõ ghi chú).
   **Sheet hiện tại đang như vậy** (link dạng chữ ở dòng 100–203 và ghi chú ở H29), nên script chuyển sang
   **ghi link vào ô link còn trống** của từng khách có code — mỗi khi bạn sửa sheet `KhachMoi`, hoặc bằng menu
   **💌 Thiệp cưới → Sinh code + link mời cho khách còn trống**. Link y hệt công thức; ô đã có chữ giữ nguyên.
   Ô tiêu đề cột link vẫn hiện `#REF!` — không sao. Khi chép khách từ chỗ khác, chỉ cần dán từ cột `code` tới `notes`.
   **Đánh dấu đã mời / mời offline:** menu **💌 Thiệp cưới → Thêm cột ô tick "Đã mời" / "Mời offline"** chèn
   hai cột ô tick mới ở đầu sheet (cột nào đã có thì bỏ qua; các cột khác dịch sang phải, dữ liệu giữ nguyên):

   | Cột | Tick nghĩa là | Cả dòng hiện |
   |---|---|---|
   | A `Đã mời` | đã gửi thiệp cho khách này | chữ xám nhạt |
   | B `Mời offline` | mời trực tiếp / thiệp giấy (để trống = mời online qua link) | nền xanh xám nhạt |
   | cả hai | | chữ xám nhạt trên nền xanh xám nhạt |

   Chỉ chạy menu này **sau khi đã Triển khai phiên bản mới** của `Code.gs` (mục 4) — bản cũ đọc cột theo vị trí
   nên sẽ không tra được khách. Chạy lại menu không đụng tới ô đã tick; quy tắc định dạng bạn tự tạo giữ nguyên.
   Không muốn chạy script thì tự làm bằng tay: chèn 2 cột bên trái cột A, gõ tiêu đề `Đã mời` và `Mời offline`,
   chọn hai cột → *Chèn → Hộp kiểm*, rồi *Định dạng → Định dạng có điều kiện* cho vùng dữ liệu, theo đúng thứ tự:
   `=($A2+$B2)=2` (chữ xám + nền xanh xám), `=$A2` (chữ xám), `=$B2` (nền xanh xám) — Google Sheets chỉ áp quy
   tắc đầu tiên khớp với mỗi ô.
3. Khi khách xác nhận tham dự, cột `rsvpStatus` / `guestCount` tự cập nhật; chi tiết ở sheet `RSVP`.
   Ở phương án B, ô Họ và tên của phần Xác nhận và Lời chúc được điền sẵn tên khách trong link (khách sửa được),
   và xác nhận vẫn gửi kèm mã khách khi Sheet chậm lúc mở thiệp.

Link không có `?to=` vẫn xem được thiệp, thấy các sự kiện có `"public"` hoặc `"all"` trong `audience`.

## 6. Trang thật trên Vercel

Thiệp đang chạy tại **<https://trung-nhi.vercel.app>** (dự án `trung-nhi` trên Vercel, gói Hobby miễn phí).

- Vercel nối với repo GitHub: **mỗi lần push lên `main` là tự build và cập nhật** sau khoảng 1 phút.
- Cấu hình build và header bảo mật nằm trong [`vercel.json`](vercel.json): build `npm run build`, thư mục `dist`
  (đổi phương án A/B bằng `phuongAn` trong `wedding.config.js` rồi push).
- Header bảo mật: CSP chỉ cho phép các dịch vụ thiệp dùng (Google Fonts, Apps Script, VietQR, ảnh Google Drive,
  jsDelivr cho phương án B), cấm nhúng thiệp vào trang khác, `nosniff`, HTTPS bắt buộc (HSTS), và
  `X-Robots-Tag: noindex` để Google không đưa tên, địa chỉ, số điện thoại lên kết quả tìm kiếm.
  Thêm dịch vụ ngoài mới (ảnh, script) thì nhớ thêm tên miền đó vào `Content-Security-Policy`.
- Giờ sự kiện, tài khoản mừng cưới, lời chúc, khách mời sửa trong Google Sheet — không cần deploy lại.

Tên miền đã điền ở `site.domain` (cả `wedding.config.js` và `huong-b/wedding.config.js`) và ô `CauHinh!B1`
trong Sheet (cột link mời tự dùng tên miền này). Đổi sang tên miền riêng sau này: thêm ở Vercel →
Project → Settings → Domains, rồi cập nhật hai chỗ trên. Facebook giữ cache ảnh xem trước; dùng
[Sharing Debugger](https://developers.facebook.com/tools/debug/) để làm mới.

## 7. Tình trạng nội dung và việc còn lại

Cập nhật 25/11/2026. Trong `wedding.config.js`: `// TODO` là thông tin còn cần điền/xác nhận; `// (gợi ý)` là
câu chữ đã viết sẵn, sửa tùy ý. Ngày âm lịch tính bằng `npm run lunar -- YYYY-MM-DD` (vd `npm run lunar -- 2026-12-13`).

**Đã có (bạn điền hoặc đã soạn sẵn)**
- [x] Tên, bố mẹ, địa chỉ, số điện thoại hai bên
- [x] Ảnh: bìa, lời mời, giữa trang, kết, chân dung, album 12 tờ, ảnh chia sẻ (`npm run photos`)
- [x] (gợi ý) Mô tả khi chia sẻ link, giới thiệu chú rể / cô dâu, câu trích, lời mời, lời cảm ơn,
      tên các mốc lịch trình, chú thích album, hạn xác nhận (10 ngày trước tiệc)
- [x] Âm lịch tính đúng theo ngày đang ghi; địa chỉ Lễ Vu Quy / Lễ Thành Hôn lấy theo địa chỉ hai nhà

**Cần bạn điền / xác nhận**
- [x] `site.domain` — `https://trung-nhi.vercel.app` (và ô `CauHinh!B1` trong Sheet)
- [x] Thiệp gửi bạn bè, đồng nghiệp: lời văn xưng "chúng tôi" / gọi khách là "bạn"; tên hiển thị "Viết Trung",
      "Phương Nhi" (`displayName`); nhãn dưới tên ở khối báo hỷ là "Chú rể" / "Cô dâu" (`role`)
- [ ] `couple.bride.familyPhone` — đang trùng số cô dâu nên mục Liên hệ tự ẩn dòng này; điền số bố/mẹ nếu muốn hiện
- [x] Lịch theo thiệp in: bữa cơm thân mật hai nhà Thứ Bảy 12/12 (04/11 âm), Lễ Vu Quy 06:00 và Lễ Thành Hôn
      10:00 Chủ nhật 13/12 (05/11 âm). Nút Chỉ đường: nhà trai theo tọa độ ghim trên Google Maps, nhà gái tới Chùa Phăn
- [x] **Giờ bữa cơm hai nhà** — đã điền trong Google Sheet (`CauHinh`, nhóm *GIỜ SỰ KIỆN*): nhà trai 15:00,
      nhà gái 16:00. Thiệp đọc giờ từ Sheet mỗi lần mở (sửa xong vài giây là thấy, gõ `17:30` hoặc `17h30`),
      không cần build lại. Giờ trong hai file `wedding.config.js` đã chép theo, chỉ dùng khi không nối được Sheet
      (Sheet không trả lời kịp và máy chưa lưu bản từ lần mở trước) — đổi giờ trong Sheet thì nhớ sửa luôn ở đây
- [x] **Mừng cưới** — đã điền trong sheet `CauHinh`, nhóm *MỪNG CƯỚI*: chú rể TPBank (có ảnh QR riêng trên
      Google Drive), cô dâu MB Bank. Thiệp tự tạo mã QR VietQR (quét được bằng mọi app ngân hàng) khi không có
      ảnh QR riêng hoặc ảnh đó không tải được. Ảnh QR riêng phải chia sẻ "Bất kỳ ai có đường liên kết".
      Không nối được Sheet thì mục Mừng cưới tự ẩn (config chỉ có số giữ chỗ, để không bao giờ hiện QR sai)
- [ ] **Ảnh QR riêng của cô dâu không tải được** (kiểm tra 25/11): link Google Drive trong ô *Cô dâu · Link ảnh
      QR riêng* trả lỗi, thiệp đang tự dùng mã VietQR thay thế (vẫn quét được). Muốn hiện đúng ảnh: mở file trên
      Drive → Chia sẻ → "Bất kỳ ai có đường liên kết"; hoặc xóa link trong ô đó để chỉ dùng VietQR
- [x] **Câu trích & giới thiệu Cặp đôi** — sửa trong sheet `CauHinh`, nhóm *LỜI TRÊN THIỆP* (phương án B đọc
      trực tiếp; ô trống thì dùng lời mặc định trong `huong-b/wedding.config.js`)
- [ ] Kiểm tra `audience` từng sự kiện (ai được thấy) cho đúng thực tế
- [x] Nhạc "Beautiful in White" (Shane Filan): `public/music/beautiful-in-white.mp3` (dùng chung cho A và B).
      Muốn có lời chạy theo nhạc thì tự đặt file `.lrc` và ghi vào `music.lyrics`.
- [x] `backend.appsScriptUrl` — đã nối Web App (mục 4)
- [x] Đã xóa 2 khách mẫu. Sổ lưu bút đã có lời chúc thật; 14 lời chúc mẫu (mã `mau` trong sheet `LoiChuc`)
      không còn hiện trên thiệp. Script không còn hàm thêm lời chúc mẫu (dữ liệu giờ là thật)

**Phương án A (đang tắt) — cần biết nếu bật lại**
- A chưa đọc câu trích và lời giới thiệu cô dâu chú rể từ Sheet (chỉ đọc giờ và tài khoản); lời lấy từ
  `wedding.config.js`.
- Nếu trong Sheet ô *Ngân hàng* để trống mà có số tài khoản, A dùng `bankBin` trong config (`970436`,
  Vietcombank) → QR sai ngân hàng. B đã chặn trường hợp này.
- Khi trình duyệt chặn tự phát nhạc, nút nhạc của A vẫn hiện "Đang phát" dù không có tiếng.
- A gói nguyên `wedding.config.js` vào JS công khai, gồm cả `photos.source` (đường dẫn thư mục ảnh trên máy).
  B đã bỏ trường này khi build.
