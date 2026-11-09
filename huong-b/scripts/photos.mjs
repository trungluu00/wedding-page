// Xử lý ảnh cưới gốc thành ảnh web chất lượng cao.
//   npm run photos
// Nguồn: biến môi trường PHOTO_SOURCE, hoặc photos.source trong wedding.config.js.
// Ảnh gốc KHÔNG chép vào repo; chỉ ảnh đã nén nằm trong photos/w/.
//
// Mỗi ảnh pNN ra 4 cỡ WebP (cạnh dài 2560 / 1600 / 900 / 400 px, không phóng to ảnh nhỏ hơn),
// chất lượng 88 + smartSubsample; xoay theo EXIF, chuyển sRGB, bỏ toàn bộ EXIF/GPS.
// Ảnh chia sẻ Zalo/Facebook: photos/share-1200x630.jpg (JPEG q90, 4:4:4) cắt từ photos.shareFrom.
// Tên mới (p01, p02...) cố định theo photos/manifest.json: chạy lại chỉ xử lý ảnh mới hoặc đã đổi.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, loadConfig } from './build.mjs';

export const SIZES = [2560, 1600, 900, 400];
const OUT_DIR = path.join(ROOT, 'photos', 'w');
const MANIFEST = path.join(ROOT, 'photos', 'manifest.json');
const SHEET = path.join(ROOT, 'photos-contact-sheet.html');
const EXT = /\.(jpe?g|png|webp|tiff?)$/i;

const exists = (p) => fs.access(p).then(() => true, () => false);
const naturalCompare = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });

const readManifest = async () => {
  try {
    return JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  } catch {
    return { sizes: SIZES, photos: [] };
  }
};

const orient = (img) => (typeof img.autoOrient === 'function' ? img.autoOrient() : img.rotate());

/** Kích thước sau khi xoay theo EXIF. */
const orientedSize = (meta) => {
  const swap = (meta.orientation ?? 1) >= 5;
  return swap ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
};

const processOne = async (srcFile, entry) => {
  const meta = await sharp(srcFile).metadata();
  const { width, height } = orientedSize(meta);
  const long = Math.max(width, height);
  const widths = [];

  for (const size of SIZES) {
    if (size > long && size !== SIZES[SIZES.length - 1]) {
      continue; // không phóng to
    }
    const scale = Math.min(1, size / long);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    await orient(sharp(srcFile, { failOn: 'none' }))
      .resize({ width: w, height: h, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
      .toColourspace('srgb')
      .webp({ quality: 88, smartSubsample: true, effort: 5 })
      .toFile(path.join(OUT_DIR, `${entry.id}-${size}.webp`));
    widths.push({ size, w, h });
  }

  return { width, height, orientation: width >= height ? 'ngang' : 'doc', widths };
};

const makeShare = async (srcFile) => {
  await orient(sharp(srcFile, { failOn: 'none' }))
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
    .toColourspace('srgb')
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(path.join(ROOT, 'photos', 'share-1200x630.jpg'));
};

const writeContactSheet = async (manifest) => {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cards = manifest.photos.map((p) => `
    <figure>
      <a href="photos/w/${p.id}-${p.widths[0].size}.webp" target="_blank"><img src="photos/w/${p.id}-400.webp" alt="${p.id}" loading="lazy" width="${p.widths.at(-1).w}" height="${p.widths.at(-1).h}"></a>
      <figcaption><b>${p.id}</b> · ${p.orientation === 'doc' ? 'dọc' : 'ngang'}<br><small>${esc(p.original)}</small></figcaption>
    </figure>`).join('');
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ảnh cưới — bảng chọn</title>
<style>
body{font-family:system-ui,sans-serif;margin:16px;background:#f7f1e5;color:#1c2a24}
h1{font-size:20px}p{max-width:70ch;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
figure{margin:0;background:#fffdf8;border:1px solid #d6d3c8;border-radius:10px;padding:8px}
img{width:100%;height:200px;object-fit:contain;background:#eee;border-radius:6px}
figcaption{font-size:13px;margin-top:6px;word-break:break-all}small{color:#5e665e}
</style></head><body>
<h1>Ảnh cưới đã xử lý (${manifest.photos.length} ảnh)</h1>
<p>Trang này chỉ để chọn ảnh, không được deploy. Ghi mã <b>pNN</b> vào <code>wedding.config.js</code> (photos.hero, couple.groom.portrait, album.leaves...). Chạm ảnh để mở bản 2560px.</p>
<div class="grid">${cards}
</div></body></html>
`;
  await fs.writeFile(SHEET, html, 'utf8');
};

const run = async () => {
  const cfg = await loadConfig();
  const source = process.env.PHOTO_SOURCE || cfg.photos?.source;
  if (!source) {
    throw new Error('Chưa có thư mục ảnh gốc: đặt PHOTO_SOURCE hoặc photos.source trong wedding.config.js');
  }
  if (!(await exists(source))) {
    throw new Error(`Không thấy thư mục ảnh gốc: ${source}`);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const manifest = await readManifest();
  const byName = new Map(manifest.photos.map((p) => [p.original, p]));
  let nextNo = manifest.photos.reduce((m, p) => Math.max(m, Number(p.id.slice(1))), 0) + 1;

  const files = (await fs.readdir(source)).filter((f) => EXT.test(f)).sort(naturalCompare);
  let done = 0;
  let skipped = 0;

  for (const name of files) {
    const full = path.join(source, name);
    const st = await fs.stat(full);
    let entry = byName.get(name);
    if (!entry) {
      entry = { id: `p${String(nextNo++).padStart(2, '0')}`, original: name };
      manifest.photos.push(entry);
      byName.set(name, entry);
    }
    const outputsOk = entry.widths && (await Promise.all(entry.widths.map((w) => exists(path.join(OUT_DIR, `${entry.id}-${w.size}.webp`))))).every(Boolean);
    if (outputsOk && entry.bytes === st.size && entry.mtime === Math.round(st.mtimeMs)) {
      skipped++;
      continue;
    }
    Object.assign(entry, await processOne(full, entry), { bytes: st.size, mtime: Math.round(st.mtimeMs) });
    done++;
    process.stdout.write(`  ${entry.id} ← ${name} (${entry.orientation})\n`);
  }

  manifest.sizes = SIZES;
  manifest.photos.sort((a, b) => naturalCompare(a.id, b.id));
  // Bỏ khỏi manifest ảnh gốc đã bị xóa khỏi thư mục nguồn (giữ file đã xuất để không vỡ config).
  const present = new Set(files);
  for (const p of manifest.photos) {
    p.missing = present.has(p.original) ? undefined : true;
  }

  // Ảnh chia sẻ
  const shareId = cfg.photos?.shareFrom;
  const shareEntry = manifest.photos.find((p) => p.id === shareId) ?? manifest.photos.find((p) => p.orientation === 'ngang');
  if (shareEntry && !shareEntry.missing) {
    await makeShare(path.join(source, shareEntry.original));
    manifest.share = shareEntry.id;
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  // Bản gọn cho trình duyệt (không lộ tên file gốc): { p01: { o: "ngang", w: [[2560, 2560, 1707], ...] } }
  const web = {};
  for (const p of manifest.photos) {
    web[p.id] = { o: p.orientation, w: p.widths.map((x) => [x.size, x.w, x.h]) };
  }
  await fs.writeFile(path.join(ROOT, 'photos', 'sizes.json'), JSON.stringify(web) + '\n', 'utf8');
  await writeContactSheet(manifest);

  let total = 0;
  for (const f of await fs.readdir(OUT_DIR)) {
    total += (await fs.stat(path.join(OUT_DIR, f))).size;
  }
  console.log(`✅ Ảnh: ${done} xử lý mới, ${skipped} giữ nguyên, tổng photos/w = ${(total / 1048576).toFixed(1)} MB. Ảnh chia sẻ từ ${manifest.share ?? '(không có)'}.`);
  console.log('   Xem và chọn ảnh: mở thẳng file huong-b/photos-contact-sheet.html bằng trình duyệt.');
};

run().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
