// Xử lý ảnh cưới gốc thành ảnh web chất lượng cao.
//   npm run photos
// Nguồn: biến môi trường PHOTO_SOURCE, hoặc photos.source trong wedding.config.js.
// Ảnh gốc KHÔNG chép vào repo; chỉ ảnh đã nén nằm trong photos/w/.
//
// - Mỗi ảnh gốc có mã cố định pNN (photos/manifest.json, theo thứ tự tên file). Chỉ những mã
//   được wedding.config.js DÙNG (bìa, chân dung, album, ảnh chèn, ảnh chia sẻ, ảnh cắt...) mới
//   được xuất; file của ảnh không còn dùng bị xóa khỏi photos/w/.
// - Mỗi ảnh ra 4 cỡ WebP theo cạnh dài: 2560 / 1600 / 900 / 400 (q88, smartSubsample),
//   không phóng to: ảnh/vùng cắt nhỏ hơn cỡ đích thì bỏ cỡ đó.
// - Xoay theo EXIF, chuyển sRGB, bỏ toàn bộ EXIF/GPS.
// - photos.crops: ảnh cắt từ một vùng của ảnh gốc (tỉ lệ 0..1), vd chân dung chú rể.
// - Ảnh chia sẻ Zalo/Facebook: photos/share-1200x630.jpg (JPEG q90, 4:4:4) từ photos.shareFrom.
// - Chạy lại chỉ xử lý ảnh mới hoặc đã đổi.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, loadConfig } from './build.mjs';

export const SIZES = [2560, 1600, 900, 400];
const OUT_DIR = path.join(ROOT, 'photos', 'w');
const MANIFEST = path.join(ROOT, 'photos', 'manifest.json');
const SHEET = path.join(ROOT, 'photos-contact-sheet.html');
const EXT = /\.(jpe?g|png|webp|tiff?)$/i;
const ID_RE = /^p\d{2,}$/;

const exists = (p) => fs.access(p).then(() => true, () => false);
const naturalCompare = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
const orient = (img) => (typeof img.autoOrient === 'function' ? img.autoOrient() : img.rotate());

const readManifest = async () => {
  try {
    return JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  } catch {
    return { sizes: SIZES, photos: [], crops: [] };
  }
};

/** Ghi lại ảnh nào đang dùng ở đâu trong config (để chỉ xuất ảnh cần và cho contact sheet). */
const collectUsage = (cfg) => {
  const usage = new Map();
  const add = (id, where) => {
    if (typeof id !== 'string' || !id) return;
    if (!usage.has(id)) usage.set(id, []);
    usage.get(id).push(where);
  };
  const ph = cfg.photos ?? {};
  add(ph.cover, 'Bìa thư');
  add(ph.hero, 'Trang đầu');
  add(ph.statement, 'Nền lời mời');
  (ph.middle ?? []).forEach((id, i) => add(id, `Ảnh chèn ${i + 1}`));
  add(ph.ending, 'Cuối thiệp');
  add(ph.shareFrom, 'Ảnh chia sẻ Zalo/Facebook');
  add(cfg.couple?.groom?.portrait, 'Chân dung chú rể');
  add(cfg.couple?.bride?.portrait, 'Chân dung cô dâu');
  let n = 0;
  for (const l of cfg.album?.leaves ?? []) {
    if (l.front) add(l.front, `Album #${++n}`);
    if (l.back) add(l.back, `Album #${++n}`);
  }
  for (const [cid, c] of Object.entries(ph.crops ?? {})) {
    if (usage.has(cid)) add(c.from, `Nguồn của ảnh cắt ${cid}`);
  }
  return usage;
};

/** Xuất các cỡ WebP từ một pipeline sharp đã định vùng; trả về danh sách cỡ thực có. */
const exportSizes = async (makeImage, id, width, height) => {
  const long = Math.max(width, height);
  const widths = [];
  for (const size of SIZES) {
    const isSmallest = size === SIZES[SIZES.length - 1];
    if (size > long && !isSmallest) {
      continue; // không phóng to
    }
    const scale = Math.min(1, size / long);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    await makeImage()
      .resize({ width: w, height: h, fit: 'fill', kernel: 'lanczos3' })
      .toColourspace('srgb')
      .webp({ quality: 88, smartSubsample: true, effort: 5 })
      .toFile(path.join(OUT_DIR, `${id}-${size}.webp`));
    widths.push({ size, w, h });
  }
  return widths;
};

const orientedSize = async (file) => {
  const meta = await sharp(file).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  return swap ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
};

const processPhoto = async (file, entry) => {
  const { width, height } = await orientedSize(file);
  const widths = await exportSizes(() => orient(sharp(file, { failOn: 'none' })), entry.id, width, height);
  return { width, height, orientation: width >= height ? 'ngang' : 'doc', widths };
};

const cropBox = (crop, width, height) => {
  const left = Math.round(crop.left * width);
  const top = Math.round(crop.top * height);
  return {
    left,
    top,
    width: Math.min(width - left, Math.round(crop.width * width)),
    height: Math.min(height - top, Math.round(crop.height * height)),
  };
};

const processCrop = async (file, id, crop) => {
  const { width, height } = await orientedSize(file);
  const box = cropBox(crop, width, height);
  // Xoay theo EXIF trước rồi mới cắt: toạ độ cắt tính trên ảnh đã đúng chiều.
  // Giữ bản giải nén không mất dữ liệu (PNG) trong bộ nhớ để các cỡ cắt từ cùng một nguồn gốc.
  const rotated = await orient(sharp(file, { failOn: 'none' })).png({ compressionLevel: 0 }).toBuffer();
  const widths = await exportSizes(() => sharp(rotated).extract(box), id, box.width, box.height);
  return { width: box.width, height: box.height, orientation: box.width >= box.height ? 'ngang' : 'doc', widths };
};

const makeShare = async (file, position) => {
  await orient(sharp(file, { failOn: 'none' }))
    .resize({ width: 1200, height: 630, fit: 'cover', position: position === 'attention' ? 'attention' : 'centre' })
    .toColourspace('srgb')
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(path.join(ROOT, 'photos', 'share-1200x630.jpg'));
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const writeContactSheet = async (manifest, usage) => {
  const all = [...manifest.photos, ...(manifest.crops ?? [])];
  const used = all.filter((p) => usage.has(p.id) && p.widths?.length);
  const unused = manifest.photos.filter((p) => !usage.has(p.id));
  const card = (p) => {
    const thumb = p.widths.find((w) => w.size === 400) ?? p.widths[p.widths.length - 1];
    const big = p.widths[0];
    return `
    <figure>
      <a href="photos/w/${p.id}-${big.size}.webp" target="_blank"><img src="photos/w/${p.id}-${thumb.size}.webp" alt="${p.id}" loading="lazy" width="${thumb.w}" height="${thumb.h}"></a>
      <figcaption><b>${esc(p.id)}</b> · ${p.orientation === 'doc' ? 'dọc' : 'ngang'} · ${big.w}×${big.h}<br>
      <small>${p.from ? `cắt từ ${esc(p.from)}` : esc(p.original)}</small>
      <ul>${usage.get(p.id).map((u) => `<li>${esc(u)}</li>`).join('')}</ul></figcaption>
    </figure>`;
  };
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ảnh cưới — bảng chọn</title>
<style>
body{font-family:system-ui,sans-serif;margin:16px;background:#f7f1e5;color:#1c2a24}
h1{font-size:20px}h2{font-size:16px;margin-top:28px}p{max-width:72ch;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
figure{margin:0;background:#fffdf8;border:1px solid #d6d3c8;border-radius:10px;padding:8px}
img{width:100%;height:200px;object-fit:contain;background:#eee;border-radius:6px}
figcaption{font-size:13px;margin-top:6px;word-break:break-word}small{color:#5e665e}
ul{margin:4px 0 0;padding-left:18px;color:#1f5c45}
.unused{font-size:13px;color:#5e665e;columns:3 220px}
</style></head><body>
<h1>Ảnh cưới đang dùng (${used.length} ảnh)</h1>
<p>Trang này chỉ để xem và chọn ảnh, không được deploy. Mỗi ảnh ghi rõ đang dùng ở đâu trong thiệp.
Đổi ảnh: sửa mã <b>pNN</b> trong <code>wedding.config.js</code> rồi chạy <code>npm run photos</code>
(ảnh mới được xuất, ảnh không còn dùng bị xóa). Chạm ảnh để mở bản lớn nhất.</p>
<div class="grid">${used.map(card).join('')}
</div>
<h2>Ảnh gốc chưa dùng (${unused.length}) — chưa xuất, thêm mã vào config để dùng</h2>
<div class="unused">${unused.map((p) => `<div><b>${esc(p.id)}</b> · ${p.orientation === 'doc' ? 'dọc' : 'ngang'} · ${esc(p.original)}</div>`).join('')}</div>
</body></html>
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
  manifest.crops = manifest.crops ?? [];
  const byName = new Map(manifest.photos.map((p) => [p.original, p]));
  let nextNo = manifest.photos.reduce((m, p) => Math.max(m, Number(p.id.slice(1))), 0) + 1;

  // 1. Gán mã cố định cho mọi ảnh gốc (kể cả ảnh chưa dùng, để mã không đổi về sau).
  const files = (await fs.readdir(source)).filter((f) => EXT.test(f)).sort(naturalCompare);
  for (const name of files) {
    if (!byName.has(name)) {
      const entry = { id: `p${String(nextNo++).padStart(2, '0')}`, original: name };
      manifest.photos.push(entry);
      byName.set(name, entry);
    }
  }
  const byId = new Map(manifest.photos.map((p) => [p.id, p]));
  const usage = collectUsage(cfg);

  // Kiểm tra mã trong config có tồn tại.
  const crops = cfg.photos?.crops ?? {};
  for (const id of usage.keys()) {
    if ((ID_RE.test(id) && !byId.has(id)) || (!ID_RE.test(id) && !crops[id] && !id.includes('/'))) {
      throw new Error(`Mã ảnh "${id}" trong wedding.config.js không có trong thư mục ảnh gốc hoặc photos.crops`);
    }
  }

  let done = 0;
  let skipped = 0;
  const outputsOk = async (entry) => entry.widths?.length
    && (await Promise.all(entry.widths.map((w) => exists(path.join(OUT_DIR, `${entry.id}-${w.size}.webp`))))).every(Boolean);

  // 2. Xuất ảnh đang dùng.
  for (const p of manifest.photos) {
    p.used = usage.has(p.id) && files.includes(p.original);
    const full = path.join(source, p.original);
    if (!p.used) {
      delete p.widths;
      continue;
    }
    const st = await fs.stat(full);
    if ((await outputsOk(p)) && p.bytes === st.size && p.mtime === Math.round(st.mtimeMs)) {
      skipped++;
      continue;
    }
    Object.assign(p, await processPhoto(full, p), { bytes: st.size, mtime: Math.round(st.mtimeMs) });
    done++;
    console.log(`  ${p.id} ← ${p.original} (${p.orientation})`);
  }

  // 3. Ảnh cắt.
  const cropEntries = [];
  for (const [cid, c] of Object.entries(crops)) {
    if (!usage.has(cid)) continue;
    const src = byId.get(c.from);
    if (!src) throw new Error(`photos.crops.${cid}.from = "${c.from}" không phải mã ảnh hợp lệ`);
    const prev = manifest.crops.find((x) => x.id === cid);
    const sig = JSON.stringify([c.from, c.left, c.top, c.width, c.height, src.bytes, src.mtime]);
    if (prev && prev.sig === sig && (await outputsOk(prev))) {
      cropEntries.push(prev);
      skipped++;
      continue;
    }
    const info = await processCrop(path.join(source, src.original), cid, c);
    cropEntries.push({ id: cid, from: c.from, crop: { left: c.left, top: c.top, width: c.width, height: c.height }, sig, ...info });
    done++;
    console.log(`  ${cid} ← cắt từ ${c.from} (${info.width}×${info.height})`);
  }
  manifest.crops = cropEntries;

  // 4. Xóa file của ảnh không còn dùng.
  const keep = new Set([...manifest.photos.filter((p) => p.used), ...cropEntries].flatMap((p) => p.widths.map((w) => `${p.id}-${w.size}.webp`)));
  let removed = 0;
  for (const f of await fs.readdir(OUT_DIR)) {
    if (!keep.has(f)) {
      await fs.rm(path.join(OUT_DIR, f));
      removed++;
    }
  }

  // 5. Ảnh chia sẻ.
  const share = byId.get(cfg.photos?.shareFrom);
  if (share && files.includes(share.original)) {
    await makeShare(path.join(source, share.original), cfg.photos?.sharePosition);
    manifest.share = share.id;
  }

  manifest.sizes = SIZES;
  manifest.photos.sort((a, b) => naturalCompare(a.id, b.id));
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  // Bản gọn cho trình duyệt (không lộ tên file gốc): { p01: { o: "ngang", w: [[2560, 2560, 1707], ...] } }
  const web = {};
  for (const p of [...manifest.photos.filter((x) => x.used), ...cropEntries]) {
    web[p.id] = { o: p.orientation, w: p.widths.map((x) => [x.size, x.w, x.h]) };
  }
  await fs.writeFile(path.join(ROOT, 'photos', 'sizes.json'), JSON.stringify(web) + '\n', 'utf8');
  await writeContactSheet(manifest, usage);

  let total = 0;
  const count = (await fs.readdir(OUT_DIR)).length;
  for (const f of await fs.readdir(OUT_DIR)) {
    total += (await fs.stat(path.join(OUT_DIR, f))).size;
  }
  console.log(`✅ Ảnh: ${Object.keys(web).length} ảnh đang dùng (${done} xử lý mới, ${skipped} giữ nguyên, ${removed} file cũ đã xóa).`);
  console.log(`   photos/w: ${count} file, ${(total / 1048576).toFixed(1)} MB. Ảnh chia sẻ từ ${manifest.share ?? '(không có)'}.`);
  console.log('   Xem ảnh nào dùng ở đâu: mở thẳng file huong-b/photos-contact-sheet.html.');
};

run().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
