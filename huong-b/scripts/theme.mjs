// Tính bảng màu lúc build (không dùng color-mix() vì iOS 15 không hỗ trợ).
// Đầu vào: 5 màu gốc (primary, accent, background, surface, text) từ preset + ghi đè trong config.
// Đầu ra: chuỗi CSS ghi vào <style> trong <head> của index.html.

export const PRESETS = {
  'luc-bao': { primary: '#1f5c45', accent: '#b8975a', background: '#f7f1e5', surface: '#fffdf8', text: '#1c2a24' },
  'xo-thom': { primary: '#5f7f65', accent: '#c9a97c', background: '#f6f1e7', surface: '#fffefa', text: '#26302a' },
  'navy': { primary: '#1f3a5f', accent: '#c4a46a', background: '#f5f0e6', surface: '#fffdf8', text: '#1b2533' },
  'xanh-bui': { primary: '#4f7397', accent: '#d6bb8e', background: '#f8f4ec', surface: '#ffffff', text: '#22303d' },
};

const KEYS = ['primary', 'accent', 'background', 'surface', 'text'];

const hexToRgb = (hex) => {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-f]{6}$/i.test(h)) {
    throw new Error(`Mã màu không hợp lệ: "${hex}" (cần dạng #rrggbb)`);
  }
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

/** Trộn màu a với p (0..1) phần màu b. mix(primary, text, 0.35) = primary pha 35% text. */
export const mix = (a, b, p) => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x.map((v, i) => v * (1 - p) + y[i] * p));
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Lấy 5 màu gốc: preset, rồi ghi đè bằng theme.colors (giá trị null/rỗng bị bỏ qua). */
export const resolveBase = (theme = {}) => {
  const name = theme.preset || 'luc-bao';
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Không có preset "${name}". Chọn một trong: ${Object.keys(PRESETS).join(', ')}`);
  }
  const base = { ...preset };
  for (const k of KEYS) {
    const v = theme.colors?.[k];
    if (v) {
      hexToRgb(v); // kiểm tra hợp lệ
      base[k] = v;
    }
  }
  return base;
};

/**
 * Từ 5 màu gốc suy ra đủ 10 màu.
 * onPrimary = trắng hoặc text, cái nào tương phản với primary cao hơn.
 * (Ở chế độ tối text là màu sáng, nên xét thêm màu nền tối làm ứng viên.)
 */
export const derive = (b, extraOnPrimary = []) => {
  const onPrimary = ['#ffffff', b.text, ...extraOnPrimary]
    .reduce((best, c) => (contrast(c, b.primary) > contrast(best, b.primary) ? c : best));
  return {
    primary: b.primary,
    accent: b.accent,
    bg: b.background,
    surface: b.surface,
    text: b.text,
    strong: mix(b.primary, b.text, 0.35),
    soft: mix(b.primary, b.background, 0.85),
    muted: mix(b.text, b.background, 0.30),
    line: mix(b.text, b.background, 0.85),
    onPrimary,
  };
};

/** Bảng màu tối suy từ cùng 5 màu gốc. */
export const darkBase = (b) => ({
  primary: mix(b.primary, b.background, 0.45),
  accent: mix(b.accent, b.background, 0.15),
  background: mix(b.text, '#000000', 0.45),
  surface: mix(b.text, b.primary, 0.25),
  text: mix(b.background, b.surface, 0.5),
});

const toVars = (c) => {
  const lines = Object.entries({
    '--c-primary': c.primary,
    '--c-accent': c.accent,
    '--c-bg': c.bg,
    '--c-surface': c.surface,
    '--c-text': c.text,
    '--c-strong': c.strong,
    '--c-soft': c.soft,
    '--c-muted': c.muted,
    '--c-line': c.line,
    '--c-on-primary': c.onPrimary,
  }).map(([k, v]) => `${k}:${v};`);

  // Kênh RGB để dùng rgba(var(--c-xxx-rgb), .5)
  for (const [k, v] of Object.entries({ primary: c.primary, accent: c.accent, bg: c.bg, surface: c.surface, text: c.text })) {
    lines.push(`--c-${k}-rgb:${hexToRgb(v).join(',')};`);
  }
  return lines.join('');
};

/** CSS cho <head>: :root (sáng) + [data-bs-theme=dark] (tối). */
export const themeCss = (theme) => {
  const base = resolveBase(theme);
  const light = derive(base);
  const db = darkBase(base);
  const dark = derive(db, [db.background]);
  return {
    light,
    dark,
    css: `:root,[data-bs-theme=light]{${toVars(light)}}[data-bs-theme=dark]{${toVars(dark)}}`,
  };
};

/** Link Google Fonts cho 3 font trong theme.fonts (css2 tự gửi subset tiếng Việt). */
export const fontsHref = (fonts = {}) => {
  const fam = (name, axis) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}${axis}`;
  const parts = [];
  if (fonts.display) parts.push(fam(fonts.display, ':ital,wght@0,400;0,600;0,700;1,400'));
  if (fonts.body && fonts.body !== fonts.display) parts.push(fam(fonts.body, ':wght@300;400;500;600'));
  if (fonts.script) parts.push(fam(fonts.script, ''));
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
};
