/**
 * Xử lý ảnh cưới: `npm run photos`
 *
 * Đọc ảnh gốc từ thư mục nguồn (biến môi trường PHOTO_SOURCE, hoặc `photos.source`
 * trong wedding.config.js). CHỈ xuất những ảnh được nhắc tới trong config
 * (photos.*, couple.*.portrait, album.leaves, photos.crops) vào public/photos/:
 *   - <id>-400.webp, -900.webp, -1600.webp, -2560.webp (cạnh dài), WebP q88
 *   - ảnh cắt (photos.crops), share-1200x630.jpg (ảnh xem trước Zalo/Facebook)
 *   - js/photo-manifest.json: id → tên gốc, kích thước từng cỡ
 * Ảnh đã xuất trước đó mà config không còn dùng sẽ bị xóa khỏi public/photos/.
 *
 * Mã ảnh (id) lấy từ tên file: "IMG_3788+++.jpg" → "img3788", "IMG_3808+++_1.jpg" → "img3808-1".
 *
 * Kèm theo: photos-contact-sheet.html (mở qua `npm run dev`, không deploy) liệt kê mọi ảnh
 * trong thư mục nguồn, đánh dấu ảnh nào đang dùng ở đâu. Thumbnail của ảnh không dùng nằm
 * trong photos-preview/ (không đưa lên git).
 *
 * Ảnh gốc KHÔNG được chép vào repo. Giữ hướng xoay EXIF, chuyển sRGB, bỏ EXIF/GPS,
 * không phóng to ảnh nhỏ. Chạy lại chỉ xử lý ảnh mới hoặc đã đổi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'photos');
const PREVIEW = path.join(ROOT, 'photos-preview');
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
fs.mkdirSync(PREVIEW, { recursive: true });

/** "IMG_3808++++++_1.jpg" → "img3808-1"; tên khác → slug của tên file. */
export function idFromFile(file) {
  const base = file.replace(/\.[^.]+$/, '');
  const m = base.match(/IMG[_-]?(\d+)[^_]*?(?:_(\d+))?[+.]*$/i);
  if (m) return `img${m[1]}${m[2] ? `-${m[2]}` : ''}`;
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const files = fs
  .readdirSync(source)
  .filter((f) => /\.(jpe?g|png|heic|tiff?|webp)$/i.test(f))
  .sort((a, b) => idFromFile(a).localeCompare(idFromFile(b), 'en', { numeric: true }));
const fileById = Object.fromEntries(files.map((f) => [idFromFile(f), f]));

// ---------------------------------------------------------------------------
// Ảnh nào đang dùng ở đâu (để chỉ xuất ảnh cần thiết và ghi vào bảng ảnh)
// ---------------------------------------------------------------------------
const usage = {}; // id -> [vị trí]
const use = (id, where) => {
  if (typeof id !== 'string' || !id) return;
  (usage[id] = usage[id] || []).push(where);
};
const P = config.photos || {};
use(P.hero, 'Ảnh bìa (hero)');
use(P.statement, 'Ảnh lời mời');
(P.middle || []).forEach((id, i) => use(id, `Ảnh giữa trang ${i + 1}`));
use(P.ending, 'Ảnh kết');
use(P.share, 'Ảnh chia sẻ 1200x630');
use(config.couple?.groom?.portrait, 'Chân dung chú rể');
use(config.couple?.bride?.portrait, 'Chân dung cô dâu');
const crops = P.crops || [];
crops.forEach((c) => use(c.from, `Cắt thành "${c.id}"`));
(config.album?.leaves || []).forEach((l, i) => {
  use(l.front, i === 0 ? 'Album · bìa trước' : `Album · trang ${String(2 * i).padStart(2, '0')}`);
  const last = i === config.album.leaves.length - 1;
  use(l.back, last ? 'Album · bìa sau' : `Album · trang ${String(2 * i + 1).padStart(2, '0')}`);
});
const cropIds = new Set(crops.map((c) => c.id));
const needed = Object.keys(usage).filter((id) => fileById[id]);
const unknown = Object.keys(usage).filter((id) => !fileById[id] && !cropIds.has(id) && !/[/.]/.test(id));
if (unknown.length) console.warn(`⚠ Không tìm thấy ảnh nguồn cho: ${unknown.join(', ')}`);

const old = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { photos: {} };
const photos = {};
let processed = 0;

async function exportSizes(input, id, extract) {
  const sizes = {};
  for (const s of SIZES) {
    let img = sharp(input, { failOn: 'none' }).rotate().toColorspace('srgb');
    if (extract) img = img.extract(extract);
    const info = await img
      .resize({ width: s, height: s, fit: 'inside', withoutEnlargement: true })
      .webp(WEBP)
      .toFile(path.join(OUT, `${id}-${s}.webp`));
    sizes[s] = [info.width, info.height];
  }
  return sizes;
}

const meta = {}; // kích thước gốc (đã xoay) của mọi ảnh cần dùng
for (const id of needed) {
  const file = fileById[id];
  const full = path.join(source, file);
  const mtime = Math.round(fs.statSync(full).mtimeMs);
  const prev = old.photos[id];
  const exists = SIZES.every((s) => fs.existsSync(path.join(OUT, `${id}-${s}.webp`)));
  if (prev && prev.mtime === mtime && exists) {
    photos[id] = prev;
  } else {
    const m = await sharp(full, { failOn: 'none' }).metadata();
    const swap = (m.orientation || 1) >= 5;
    const W = swap ? m.height : m.width;
    const H = swap ? m.width : m.height;
    photos[id] = {
      original: file,
      mtime,
      width: W,
      height: H,
      orientation: W > H ? 'landscape' : W < H ? 'portrait' : 'square',
      sizes: await exportSizes(full, id),
    };
    processed++;
    process.stdout.write(`\r${id} ← ${file}`.padEnd(70));
  }
  meta[id] = photos[id];
}

// Ảnh cắt: photos.crops = [{ id, from, x, y, width, aspect }]
//   x, y, width: tỉ lệ 0–1 theo chiều rộng/cao ảnh gốc; aspect = rộng/cao (1 = vuông, 0.8 = 4:5)
for (const c of crops) {
  const src = meta[c.from];
  if (!c.id || !src) {
    console.warn(`Bỏ qua ảnh cắt "${c.id}": không có ảnh nguồn "${c.from}"`);
    continue;
  }
  const aspect = c.aspect || 1;
  const width = Math.round((c.width ?? c.size) * src.width);
  const height = Math.min(src.height, Math.round(width / aspect));
  const left = Math.max(0, Math.min(src.width - width, Math.round(c.x * src.width)));
  const top = Math.max(0, Math.min(src.height - height, Math.round(c.y * src.height)));
  const key = JSON.stringify([c.from, left, top, width, height, src.mtime]);
  const exists = SIZES.every((s) => fs.existsSync(path.join(OUT, `${c.id}-${s}.webp`)));
  if (old.photos[c.id]?.cropKey === key && exists) {
    photos[c.id] = old.photos[c.id];
    continue;
  }
  photos[c.id] = {
    original: `${src.original} (cắt)`,
    cropKey: key,
    width,
    height,
    orientation: width > height ? 'landscape' : width < height ? 'portrait' : 'square',
    sizes: await exportSizes(path.join(source, src.original), c.id, { left, top, width, height }),
  };
  processed++;
}
process.stdout.write('\n');

// Ảnh chia sẻ 1200x630 (JPEG q90, 4:4:4) — cắt vùng nổi bật
const shareOut = path.join(OUT, 'share-1200x630.jpg');
if (P.share && meta[P.share]) {
  await sharp(path.join(source, meta[P.share].original), { failOn: 'none' })
    .rotate()
    .toColorspace('srgb')
    .resize(1200, 630, { fit: 'cover', position: P.sharePosition || sharp.strategy.attention })
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(shareOut);
}

// Xóa ảnh đã xuất trước đó mà config không còn dùng
let removed = 0;
for (const f of fs.readdirSync(OUT)) {
  const m = f.match(/^(.+)-(\d+)\.webp$/);
  if (m && SIZES.includes(Number(m[2])) && !photos[m[1]]) {
    fs.unlinkSync(path.join(OUT, f));
    removed++;
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify({ sizes: SIZES, photos }, null, 2) + '\n');

// ---------------------------------------------------------------------------
// Bảng ảnh: mọi ảnh nguồn + ảnh cắt, đánh dấu đang dùng ở đâu
// ---------------------------------------------------------------------------
for (const f of files) {
  const id = idFromFile(f);
  const thumb = path.join(PREVIEW, `${id}.webp`);
  if (photos[id] || fs.existsSync(thumb)) continue;
  await sharp(path.join(source, f), { failOn: 'none' }).rotate().resize(400, 400, { fit: 'inside' }).webp({ quality: 75 }).toFile(thumb);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const card = (id, original, orientation) => {
  const used = usage[id] || [];
  const src = photos[id] ? `/photos/${id}-400.webp` : `/photos-preview/${id}.webp`;
  const big = photos[id] ? `/photos/${id}-2560.webp` : src;
  const ori = orientation === 'portrait' ? 'dọc' : orientation === 'landscape' ? 'ngang' : 'vuông';
  return `<figure class="${used.length ? 'used' : ''}"><a href="${big}" target="_blank"><img src="${src}" loading="lazy" alt="${id}"></a>
<figcaption><b>${id}</b>${ori ? ` · ${ori}` : ''}${used.length ? `<ul>${used.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : '<div class="unused">Chưa dùng</div>'}<small>${esc(original)}</small></figcaption></figure>`;
};
const allCards = [
  ...crops.filter((c) => photos[c.id]).map((c) => card(c.id, photos[c.id].original, photos[c.id].orientation)),
  ...files.map((f) => {
    const id = idFromFile(f);
    return card(id, f, photos[id]?.orientation);
  }),
];
const usedCount = files.filter((f) => usage[idFromFile(f)]).length;
fs.writeFileSync(
  SHEET,
  `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bảng ảnh — chọn ảnh cho thiệp</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;background:#f7f1e5;color:#1c2a24}h1{font-size:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
figure{margin:0;background:#fff;border-radius:8px;padding:6px;border:2px solid transparent;opacity:.6}
figure.used{border-color:#1f5c45;opacity:1}img{width:100%;height:170px;object-fit:contain;background:#eee;border-radius:4px}
figcaption{margin-top:4px;word-break:break-all}ul{margin:4px 0;padding-left:16px;color:#1f5c45}small{color:#666}.unused{color:#999}</style></head><body>
<h1>Bảng ảnh: đang dùng ${usedCount}/${files.length} ảnh</h1>
<p>Ảnh viền xanh đang dùng trên thiệp (ghi rõ vị trí). Ghi <b>id</b> (vd <code>img3788</code>) vào <code>photos</code>, <code>couple.*.portrait</code>
hoặc <code>album.leaves</code> trong <code>wedding.config.js</code> rồi chạy <code>npm run photos</code>. Bấm ảnh để xem cỡ lớn. Trang này không được deploy;
thumbnail ảnh chưa dùng nằm trong <code>photos-preview/</code> (chỉ có trên máy đã chạy script).</p>
<div class="grid">${allCards.join('\n')}</div></body></html>\n`
);

const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`Xong: ${Object.keys(photos).length} ảnh trong public/photos (${processed} ảnh mới xử lý, ${removed} file cũ đã xóa). Tổng: ${(total / 1e6).toFixed(1)} MB`);
for (const s of SIZES) {
  const sum = Object.keys(photos).reduce((a, id) => a + fs.statSync(path.join(OUT, `${id}-${s}.webp`)).size, 0);
  console.log(`  cỡ ${s}px: ${(sum / 1e6).toFixed(1)} MB`);
}
