/**
 * Plugin Vite cho thiệp cưới — chạy lúc dev và lúc build:
 *  1. Đọc `theme` trong wedding.config.js, tính các màu phụ (không dùng color-mix()
 *     để chạy được trên iOS 15) và ghi vào <style>:root{...}</style>.
 *  2. Sinh link Google Fonts theo `theme.fonts`.
 *  3. Ghi <title>, description, og:* (URL tuyệt đối) vào HTML — Zalo/Facebook không chạy JS.
 *  4. Sinh ảnh giữ chỗ SVG (photos/placeholder/<tên>.svg) theo màu theme.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------------------
// Bộ màu có sẵn
// ---------------------------------------------------------------------------
export const PRESETS = {
  'luc-bao': { primary: '#1f5c45', accent: '#b8975a', background: '#f7f1e5', surface: '#fffdf8', text: '#1c2a24' },
  'xo-thom': { primary: '#5f7f65', accent: '#c9a97c', background: '#f6f1e7', surface: '#fffefa', text: '#26302a' },
  navy: { primary: '#1f3a5f', accent: '#c4a46a', background: '#f5f0e6', surface: '#fffdf8', text: '#1b2533' },
  'xanh-bui': { primary: '#4f7397', accent: '#d6bb8e', background: '#f8f4ec', surface: '#ffffff', text: '#22303d' },
};

// ---------------------------------------------------------------------------
// Tiện ích màu
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`[wedding] Mã màu không hợp lệ: "${hex}" (cần dạng #rrggbb)`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** Trộn a với b: p = tỉ lệ của b (0..1). */
const mix = (a, b, p) => a.map((v, i) => v * (1 - p) + b[i] * p);
function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function resolveTheme(theme = {}) {
  const presetName = theme.preset && PRESETS[theme.preset] ? theme.preset : 'luc-bao';
  if (theme.preset && !PRESETS[theme.preset]) {
    console.warn(`[wedding] Không có preset "${theme.preset}", dùng "luc-bao".`);
  }
  const overrides = Object.fromEntries(Object.entries(theme.colors || {}).filter(([, v]) => v));
  const base = { ...PRESETS[presetName], ...overrides };

  const primary = hexToRgb(base.primary);
  const accent = hexToRgb(base.accent);
  const bg = hexToRgb(base.background);
  const surface = hexToRgb(base.surface);
  const text = hexToRgb(base.text);
  const white = [255, 255, 255];

  const roles = {
    primary,
    accent,
    'accent-strong': mix(accent, text, 0.35),
    bg,
    surface,
    text,
    strong: mix(primary, text, 0.35),
    soft: mix(primary, bg, 0.85),
    muted: mix(text, bg, 0.3),
    line: mix(text, bg, 0.85),
    'on-primary': contrast(white, primary) >= contrast(text, primary) ? white : text,
  };
  return { preset: presetName, roles };
}

export function themeCss(theme = {}) {
  const { roles } = resolveTheme(theme);
  const fonts = { display: 'Playfair Display', body: 'Be Vietnam Pro', script: 'Great Vibes', ...(theme.fonts || {}) };
  const lines = [];
  for (const [name, rgb] of Object.entries(roles)) {
    const r = rgb.map((v) => Math.round(v));
    lines.push(`--c-${name}:${rgbToHex(r)};--c-${name}-rgb:${r.join(' ')};`);
  }
  lines.push(`--font-display:"${fonts.display}";--font-body:"${fonts.body}";--font-script-name:"${fonts.script}";`);
  return `:root{${lines.join('')}}`;
}

// ---------------------------------------------------------------------------
// Google Fonts — mỗi font một <link> để một font sai tên không làm hỏng font khác
// ---------------------------------------------------------------------------
const FONT_AXES = {
  'Playfair Display': 'ital,wght@0,400;0,500;0,600;0,700;1,400',
  'Be Vietnam Pro': 'ital,wght@0,200;0,300;0,400;0,500;0,600;1,300;1,400',
  'Cormorant Garamond': 'ital,wght@0,300;0,400;0,500;0,600;1,300;1,400',
  Lora: 'ital,wght@0,400;0,500;0,600;1,400',
  Montserrat: 'wght@300;400;500;600',
  'Noto Serif': 'ital,wght@0,400;0,600;1,400',
  'Dancing Script': 'wght@400;600',
};
function fontLinks(fontsCfg = {}) {
  const fonts = { display: 'Playfair Display', body: 'Be Vietnam Pro', script: 'Great Vibes', ...fontsCfg };
  const unique = [...new Set(Object.values(fonts).filter(Boolean))];
  return unique
    .map((name) => {
      const axes = FONT_AXES[name] ? `:${FONT_AXES[name]}` : '';
      const fam = encodeURIComponent(name).replace(/%20/g, '+');
      return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fam}${axes}&display=swap">`;
    })
    .join('\n  ');
}

// ---------------------------------------------------------------------------
// Ảnh giữ chỗ
// ---------------------------------------------------------------------------
const PLACEHOLDER_RE = /^\/?photos\/placeholder\/([\w-]+)\.svg$/;

function placeholderSpec(name) {
  if (name === 'groom') return { w: 900, h: 900, label: 'Chú rể' };
  if (name === 'bride') return { w: 900, h: 900, label: 'Cô dâu' };
  if (name === 'statement') return { w: 1440, h: 900, label: 'Ảnh đôi' };
  if (name === 'ending') return { w: 1200, h: 1600, label: 'Ảnh kết', y: 0.22 }; // chữ cảm ơn nằm giữa ảnh
  if (name === 'hero') return { w: 1200, h: 1500, label: 'Ảnh bìa' };
  if (name === 'album-cover') return { w: 1200, h: 1680, label: 'Album cưới', cover: true };
  if (name === 'album-back') return { w: 1200, h: 1680, label: 'Trọn vẹn yêu thương', cover: true };
  const page = name.match(/^album-(\d+)$/);
  if (page) return { w: 1200, h: 1680, label: `Trang ${page[1]}` };
  const mid = name.match(/^middle-(\d+)$/);
  if (mid) return { w: 1200, h: 1500, label: `Khoảnh khắc ${mid[1]}` };
  return { w: 1200, h: 1500, label: name };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function placeholderSvg(name, config) {
  const { roles } = resolveTheme(config.theme);
  const hex = (k) => rgbToHex(roles[k].map(Math.round));
  const { w, h, label, cover, y = 0.44 } = placeholderSpec(name);
  const g = config.couple?.groom?.shortName || '';
  const b = config.couple?.bride?.shortName || '';
  const orn = config.theme?.ornament === 'monogram' ? `${g[0] || ''} · ${b[0] || ''}` : config.theme?.ornament === 'none' ? '❦' : '囍';
  const bgA = cover ? hex('primary') : hex('soft');
  const bgB = cover ? hex('strong') : hex('bg');
  const fg = cover ? hex('on-primary') : hex('strong');
  const acc = hex('accent');
  const m = Math.round(Math.min(w, h) * 0.05);
  const fs = Math.round(Math.min(w, h) * 0.075);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" fill="none" stroke="${acc}" stroke-width="${Math.max(2, m / 10)}" opacity=".7"/>
<text x="50%" y="${Math.round(y * 100)}%" text-anchor="middle" font-family="Georgia, serif" font-size="${fs * 1.6}" fill="${acc}">${esc(orn)}</text>
<text x="50%" y="${Math.round(h * y + fs * 1.5)}" text-anchor="middle" font-family="Georgia, serif" font-size="${fs}" fill="${fg}">Ảnh cưới</text>
<text x="50%" y="${Math.round(h * y + fs * 2.6)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(fs * 0.42)}" letter-spacing="3" fill="${fg}" opacity=".75">${esc(label.toUpperCase())}</text>
</svg>`;
}

function collectPlaceholders(obj, out = new Set()) {
  if (typeof obj === 'string') {
    const m = obj.match(PLACEHOLDER_RE);
    if (m) out.add(m[1]);
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach((v) => collectPlaceholders(v, out));
  }
  return out;
}

// ---------------------------------------------------------------------------
// HTML <head>
// ---------------------------------------------------------------------------
function headHtml(config) {
  const site = config.site || {};
  const domain = String(site.domain || '').replace(/\/+$/, '');
  const abs = (p) => (/^https?:\/\//.test(p) ? p : `${domain}/${String(p).replace(/^\/+/, '')}`);
  const title = site.title || 'Thiệp cưới';
  const desc = site.description || '';
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    domain ? `<meta property="og:url" content="${esc(domain + '/')}">` : '',
    site.ogImage ? `<meta property="og:image" content="${esc(abs(site.ogImage))}">` : '',
    site.ogImage ? `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="${rgbToHex(resolveTheme(config.theme).roles.primary.map(Math.round))}">`,
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    fontLinks(config.theme?.fonts),
    `<style id="wedding-theme">${themeCss(config.theme)}</style>`,
  ];
  return tags.filter(Boolean).join('\n  ');
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------
export default function weddingPlugin({ configFile = 'wedding.config.js' } = {}) {
  let root = process.cwd();
  let publicDir = path.join(root, 'public');
  const configPath = () => path.resolve(root, configFile);
  // Import mới mỗi lần để dev server thấy thay đổi ngay mà không cần khởi động lại
  const loadConfig = async () => (await import(pathToFileURL(configPath()).href + `?t=${Date.now()}`)).default;

  return {
    name: 'wedding-config',
    configResolved(c) {
      root = c.root;
      publicDir = c.publicDir || path.join(root, 'public');
    },
    async transformIndexHtml(html) {
      const config = await loadConfig();
      return html.replace('<!--WEDDING_HEAD-->', headHtml(config));
    },
    configureServer(server) {
      server.watcher.add(configPath());
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        const m = url.match(PLACEHOLDER_RE);
        if (!m || fs.existsSync(path.join(publicDir, url))) return next();
        const config = await loadConfig();
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(placeholderSvg(m[1], config));
      });
    },
    handleHotUpdate(ctx) {
      if (path.resolve(ctx.file) === configPath()) {
        ctx.server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
    async generateBundle() {
      const config = await loadConfig();
      for (const name of collectPlaceholders(config)) {
        const fileName = `photos/placeholder/${name}.svg`;
        if (fs.existsSync(path.join(publicDir, fileName))) continue;
        this.emitFile({ type: 'asset', fileName, source: placeholderSvg(name, config) });
      }
      // Cảnh báo những file được nhắc trong config nhưng không có trong public/
      const missing = [];
      const check = (p) => {
        if (typeof p !== 'string' || !p || /^https?:/.test(p) || PLACEHOLDER_RE.test(p)) return;
        if (!fs.existsSync(path.join(publicDir, p))) missing.push(p);
      };
      check(config.site?.ogImage);
      check(config.music?.src);
      check(config.music?.lyrics);
      Object.values(config.photos || {}).flat().forEach(check);
      (config.album?.leaves || []).forEach((l) => [l.front, l.back].forEach(check));
      Object.values(config.couple || {}).forEach((p) => check(p.portrait));
      (config.gifts?.accounts || []).forEach((a) => check(a.qrImage));
      if (missing.length) {
        this.warn(`Thiếu file trong public/ (config có nhắc tới): ${missing.join(', ')}`);
      }
    },
  };
}
