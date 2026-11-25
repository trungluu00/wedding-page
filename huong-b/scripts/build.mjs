// Build thiệp ra thư mục public/ (thư mục này là thứ deploy lên Cloudflare Pages/Vercel).
//   node scripts/build.mjs        → build bản chạy thật (đã nén)
// Hàm ở đây cũng được scripts/dev.mjs dùng lại.
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { themeCss, fontsHref } from './theme.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(ROOT, 'public');
export const CONFIG_FILE = path.join(ROOT, 'wedding.config.js');

const STATIC_DIRS = ['photos', 'music', 'assets'];

/** Đọc wedding.config.js (luôn đọc bản mới nhất, bỏ qua cache của import). */
export const loadConfig = async () => {
  const mod = await import(`${pathToFileURL(CONFIG_FILE).href}?t=${Date.now()}`);
  const cfg = mod.default;
  if (!cfg || typeof cfg !== 'object') {
    throw new Error('wedding.config.js phải "export default { ... }"');
  }
  if (!cfg.couple?.groom?.fullName || !cfg.couple?.bride?.fullName) {
    throw new Error('Thiếu couple.groom.fullName hoặc couple.bride.fullName trong wedding.config.js');
  }
  return cfg;
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Ghép URL tuyệt đối từ site.domain (Zalo/Facebook cần URL đầy đủ cho og:image). */
const absUrl = (domain, p) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const d = String(domain || '').replace(/\/+$/, '');
  return `${d}/${String(p).replace(/^\.?\//, '')}`;
};

const fontStack = (name, fallback) => (name ? `'${String(name).replace(/'/g, '')}', ${fallback}` : fallback);

/**
 * Tải sẵn ảnh bìa thư ngay từ <head>, song song với CSS / JS / cấu hình Sheet — không đợi JS dựng bìa xong mới
 * bắt đầu tải (đo trên 4G: ảnh bìa đến muộn 1,5–2 giây). srcset / sizes phải giống hệt thẻ <img> của bìa
 * (js/common/photo.js, bìa rộng 12rem = 192px) để trình duyệt dùng lại đúng file đã tải.
 */
const coverPreload = (cfg) => {
  const id = cfg.photos?.cover;
  if (!id) return '';
  let sizes = {};
  try {
    sizes = JSON.parse(readFileSync(path.join(ROOT, 'photos', 'sizes.json'), 'utf8'));
  } catch {
    return '';
  }
  const p = sizes[id];
  if (!p) return `<link rel="preload" as="image" href="${esc(id)}" fetchpriority="high">`;
  const url = (s) => `photos/w/${id}-${s}.webp`;
  const choices = p.w.filter((x) => x[0] < 2560);
  const list = choices.length ? choices : p.w;
  const src = (p.w.find((x) => x[0] === 900) ?? p.w[p.w.length - 1])[0];
  return `<link rel="preload" as="image" href="${url(src)}" imagesrcset="${list.map((x) => `${url(x[0])} ${x[1]}w`).join(', ')}" imagesizes="192px" fetchpriority="high">`;
};

export const renderHead = (cfg) => {
  const site = cfg.site ?? {};
  const theme = themeCss(cfg.theme ?? {});
  const fonts = cfg.theme?.fonts ?? {};
  const title = site.title || `Thiệp cưới ${cfg.couple.groom.shortName} & ${cfg.couple.bride.shortName}`;
  const desc = site.description || title;
  const domain = site.domain && !/TODO/i.test(site.domain) ? site.domain : '';
  const ogImage = absUrl(domain, site.ogImage);
  const fontsUrl = fontsHref(fonts);

  if (!domain) {
    console.warn('⚠️  site.domain chưa điền (đang là TODO): og:image/og:url sẽ là đường dẫn tương đối, Zalo/Facebook có thể không hiện ảnh xem trước.');
  }

  const fontVars = `:root{--f-display:${fontStack(fonts.display, 'Georgia, serif')};--f-body:${fontStack(fonts.body, 'system-ui, sans-serif')};--f-script:${fontStack(fonts.script, 'cursive')};}`;

  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<meta name="robots" content="noindex, nofollow">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:site_name" content="${esc(title)}">`,
    domain ? `<meta property="og:url" content="${esc(domain)}/">` : '',
    ogImage ? `<meta property="og:image" content="${esc(ogImage || site.ogImage)}">` : '',
    ogImage && ogImage.startsWith('https://') ? `<meta property="og:image:secure_url" content="${esc(ogImage)}">` : '',
    `<meta property="og:image:type" content="image/jpeg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="${theme.light.primary}">`,
    `<meta name="color-scheme" content="light dark">`,
    `<meta name="format-detection" content="telephone=no">`,
    `<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">`,
    // Mở sẵn kết nối trước khi gặp file font / CSS (đặt sau thì vô tác dụng). CSS của Google Fonts tải không kèm
    // crossorigin, file font thì có — nên mỗi host một kiểu; jsDelivr tải CSS/JS có SRI (crossorigin).
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">`,
    `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous">`,
    coverPreload(cfg),
    `<link rel="stylesheet" href="${esc(fontsUrl)}">`,
    `<style id="theme-vars">${theme.css}${fontVars}</style>`,
  ].filter(Boolean).join('\n    ');
};

export const buildHtml = async (cfg) => {
  const tpl = await fs.readFile(path.join(ROOT, 'src', 'index.html'), 'utf8');
  if (!tpl.includes('<!--@HEAD-->')) {
    throw new Error('src/index.html thiếu chỗ đánh dấu <!--@HEAD-->');
  }
  const html = tpl.replace('<!--@HEAD-->', renderHead(cfg));
  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'index.html'), html, 'utf8');
};

/** Nhạc dùng chung với phương án A (thư mục gốc/public/music) khi huong-b/ không có thư mục music riêng. */
const SHARED = { music: path.join(ROOT, '..', 'public', 'music') };

const exists = async (p) => fs.access(p).then(() => true, () => false);

export const copyStatic = async () => {
  for (const dir of STATIC_DIRS) {
    let src = path.join(ROOT, dir);
    if (!(await exists(src)) && SHARED[dir] && (await exists(SHARED[dir]))) {
      src = SHARED[dir];
    }
    if (!(await exists(src))) {
      continue;
    }
    // manifest.json/sizes.json chỉ dùng lúc build (sizes.json đã gói vào JS); manifest có tên file gốc nên không deploy.
    const skip = new Set(['manifest.json', 'sizes.json']);
    await fs.cp(src, path.join(OUT, dir), { recursive: true, force: true, filter: (f) => !skip.has(path.basename(f)) });
  }
  // Header bảo mật cơ bản cho Cloudflare Pages (Vercel đọc vercel.json).
  await fs.copyFile(path.join(ROOT, 'src', '_headers'), path.join(OUT, '_headers'));
};

/**
 * Khi gói JS, thay wedding.config.js bằng bản JSON đã bỏ photos.source (đường dẫn thư mục ảnh gốc
 * trên máy, chỉ dùng cho `npm run photos`) để đường dẫn đó không lộ trong file JS công khai.
 */
const configPlugin = {
  name: 'wedding-config',
  setup(b) {
    b.onLoad({ filter: /[\\/]wedding\.config\.js$/ }, async (args) => {
      const cfg = structuredClone(await loadConfig());
      if (cfg.photos) {
        delete cfg.photos.source;
      }
      return { contents: `export default ${JSON.stringify(cfg)};`, loader: 'js', watchFiles: [args.path] };
    });
  },
};

export const esbuildOptions = (dev = false) => ({
  absWorkingDir: ROOT,
  plugins: [configPlugin],
  entryPoints: ['js/guest.js', 'css/guest.css'],
  entryNames: '[name]',
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  outdir: path.join(OUT, 'dist'),
  // Trình duyệt trong Zalo/Messenger trên iPhone cũ (iOS 14-15) vẫn chạy được.
  target: ['es2019', 'safari14', 'chrome80'],
  external: ['*.woff', '*.woff2'],
  logLevel: 'warning',
  legalComments: 'none',
});

export const build = async () => {
  const t = Date.now();
  const cfg = await loadConfig();
  await fs.rm(OUT, { recursive: true, force: true });
  await buildHtml(cfg);
  await copyStatic();
  await esbuild.build(esbuildOptions(false));
  console.log(`✅ Build xong vào public/ (${Date.now() - t} ms). Preset màu: ${cfg.theme?.preset ?? 'luc-bao'}`);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((e) => {
    console.error('❌ Build lỗi:', e.message);
    process.exit(1);
  });
}
