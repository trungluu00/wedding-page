/**
 * Xử lý ảnh cưới: `npm run photos`
 *
 * Đọc ảnh gốc từ thư mục nguồn (biến môi trường PHOTO_SOURCE, hoặc `photos.source`
 * trong wedding.config.js), xuất vào public/photos/:
 *   - <id>-400.webp, -900.webp, -1600.webp, -2560.webp (cạnh dài), WebP q88
 *   - share-1200x630.jpg (ảnh xem trước Zalo/Facebook) từ ảnh `photos.share`
 *   - js/photo-manifest.json: id → tên gốc, kích thước từng cỡ
 *   - photos-contact-sheet.html: bảng xem nhanh mọi ảnh (mở qua `npm run dev`, không deploy)
 *
 * Ảnh gốc KHÔNG được chép vào repo. Giữ hướng xoay EXIF, chuyển sRGB, bỏ EXIF/GPS.
 * Chạy lại chỉ xử lý ảnh mới hoặc đã đổi (so thời gian sửa file).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'photos');
const MANIFEST = path.join(ROOT, 'js', 'photo-manifest.json');
const SHEET = path.join(ROOT, 'photos-contact-sheet.html');
const SIZES = [400, 900, 1600, 2560];
const WEBP = { quality: 88, smartSubsample: true, effort: 5 };

const config = (await import(pathToFileURL(path.join(ROOT, 'wedding.config.js')).href)).default;
const source = process.env.PHOTO_SOURCE || config.photos?.source;
if (!source || !fs.existsSync(source)) {
  console.error(`Không thấy thư mục ảnh nguồn: "${source || ''}". Đặt PHOTO_SOURCE hoặc photos.source trong wedding.config.js.`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { photos: {} };

// Sắp theo số ảnh trong tên (IMG_3667…) để id theo thứ tự chụp
const files = fs
  .readdirSync(source)
  .filter((f) => /\.(jpe?g|png|heic|tiff?|webp)$/i.test(f))
  .sort((a, b) => {
    const na = Number((a.match(/(\d{3,})/) || [])[1] || 0);
    const nb = Number((b.match(/(\d{3,})/) || [])[1] || 0);
    return na - nb || a.localeCompare(b);
  });

// Giữ nguyên id cho ảnh đã có, ảnh mới nhận id tiếp theo
const byOriginal = Object.fromEntries(Object.entries(old.photos).filter(([id]) => /^p\d+$/.test(id)).map(([id, p]) => [p.original, id]));
let nextNum = Math.max(0, ...Object.keys(old.photos).filter((id) => /^p\d+$/.test(id)).map((id) => Number(id.slice(1)))) + 1;
const photos = {};
let processed = 0;

for (const file of files) {
  const id = byOriginal[file] || `p${String(nextNum++).padStart(2, '0')}`;
  const full = path.join(source, file);
  const mtime = Math.round(fs.statSync(full).mtimeMs);
  const prev = old.photos[id];
  const outputs = SIZES.map((s) => path.join(OUT, `${id}-${s}.webp`));
  if (prev && prev.mtime === mtime && outputs.every((o) => fs.existsSync(o))) {
    photos[id] = prev;
    continue;
  }

  const base = sharp(full, { failOn: 'none' }).rotate(); // xoay theo EXIF
  const meta = await base.metadata();
  const swap = (meta.orientation || 1) >= 5;
  const W = swap ? meta.height : meta.width;
  const H = swap ? meta.width : meta.height;
  const sizes = {};
  for (const s of SIZES) {
    const info = await sharp(full, { failOn: 'none' })
      .rotate()
      .toColorspace('srgb')
      .resize({ width: s, height: s, fit: 'inside', withoutEnlargement: true })
      .webp(WEBP)
      .toFile(path.join(OUT, `${id}-${s}.webp`));
    sizes[s] = [info.width, info.height];
  }
  photos[id] = { original: file, mtime, width: W, height: H, orientation: W > H ? 'landscape' : W < H ? 'portrait' : 'square', sizes };
  processed++;
  process.stdout.write(`\r${id} ← ${file}`.padEnd(70));
}
process.stdout.write('\n');

// Ảnh cắt (vd chân dung từ ảnh chụp chung): photos.crops = [{ id, from, x, y, size }]
// x, y, size tính theo tỉ lệ (0–1) của chiều rộng ảnh gốc; khung cắt hình vuông.
for (const c of config.photos?.crops || []) {
  const srcPhoto = photos[c.from];
  if (!c.id || !srcPhoto) {
    console.warn(`Bỏ qua ảnh cắt "${c.id}": không có ảnh nguồn "${c.from}"`);
    continue;
  }
  const key = JSON.stringify([c.from, c.x, c.y, c.size, srcPhoto.mtime]);
  const outputs = SIZES.map((s) => path.join(OUT, `${c.id}-${s}.webp`));
  if (old.photos[c.id]?.cropKey === key && outputs.every((o) => fs.existsSync(o))) {
    photos[c.id] = old.photos[c.id];
    continue;
  }
  const side = Math.round(c.size * srcPhoto.width);
  const left = Math.max(0, Math.min(srcPhoto.width - side, Math.round(c.x * srcPhoto.width)));
  const top = Math.max(0, Math.min(srcPhoto.height - side, Math.round(c.y * srcPhoto.height)));
  const sizes = {};
  for (const s of SIZES) {
    const info = await sharp(path.join(source, srcPhoto.original), { failOn: 'none' })
      .rotate()
      .toColorspace('srgb')
      .extract({ left, top, width: side, height: side })
      .resize({ width: s, height: s, fit: 'inside', withoutEnlargement: true })
      .webp(WEBP)
      .toFile(path.join(OUT, `${c.id}-${s}.webp`));
    sizes[s] = [info.width, info.height];
  }
  photos[c.id] = { original: `${srcPhoto.original} (cắt)`, cropKey: key, width: side, height: side, orientation: 'square', sizes };
  processed++;
}

// Ảnh chia sẻ 1200x630 (JPEG q90, 4:4:4)
const shareId = config.photos?.share;
const shareOut = path.join(OUT, 'share-1200x630.jpg');
if (shareId && photos[shareId]) {
  const src = path.join(source, photos[shareId].original);
  await sharp(src, { failOn: 'none' })
    .rotate()
    .toColorspace('srgb')
    .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(shareOut);
}

fs.writeFileSync(MANIFEST, JSON.stringify({ sizes: SIZES, photos }, null, 2) + '\n');

// Bảng xem nhanh
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cards = Object.entries(photos)
  .map(
    ([id, p]) => `<figure><a href="/photos/${id}-2560.webp" target="_blank"><img src="/photos/${id}-400.webp" loading="lazy" alt="${id}"></a>
<figcaption><b>${id}</b> · ${p.orientation === 'portrait' ? 'dọc' : p.orientation === 'landscape' ? 'ngang' : 'vuông'}<br><small>${esc(p.original)}</small></figcaption></figure>`
  )
  .join('\n');
fs.writeFileSync(
  SHEET,
  `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bảng ảnh — chọn ảnh cho thiệp</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;background:#f7f1e5;color:#1c2a24}h1{font-size:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
figure{margin:0;background:#fff;border-radius:8px;padding:6px}img{width:100%;height:170px;object-fit:contain;background:#eee;border-radius:4px}
figcaption{margin-top:4px;word-break:break-all}small{color:#666}</style></head><body>
<h1>Bảng ảnh (${Object.keys(photos).length} ảnh)</h1>
<p>Ghi <b>id</b> (vd <code>p05</code>) vào <code>photos</code> / <code>album</code> trong <code>wedding.config.js</code>. Bấm ảnh để xem cỡ lớn. Trang này không được deploy.</p>
<div class="grid">${cards}</div></body></html>\n`
);

const total = fs
  .readdirSync(OUT)
  .filter((f) => /^(p\d+-\d+\.webp|share-1200x630\.jpg)$/.test(f))
  .reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`Xong: ${Object.keys(photos).length} ảnh (${processed} ảnh mới xử lý). Tổng dung lượng public/photos: ${(total / 1e6).toFixed(1)} MB`);
for (const s of SIZES) {
  const sum = Object.keys(photos).reduce((a, id) => a + fs.statSync(path.join(OUT, `${id}-${s}.webp`)).size, 0);
  console.log(`  cỡ ${s}px: ${(sum / 1e6).toFixed(1)} MB`);
}
