// Chạy thử trên máy: node scripts/dev.mjs  →  http://localhost:8080
// Sửa wedding.config.js / src/index.html / ảnh thì tự build lại, chỉ cần tải lại trang.
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { ROOT, OUT, loadConfig, buildHtml, copyStatic, esbuildOptions } from './build.mjs';

const PORT = Number(process.env.PORT || 8080);

const rebuildHtml = async () => {
  try {
    await buildHtml(await loadConfig());
    await copyStatic();
    console.log(`↻ ${new Date().toLocaleTimeString('vi-VN')} đã cập nhật index.html`);
  } catch (e) {
    console.error('❌', e.message);
  }
};

const debounce = (fn, ms = 150) => {
  let t = null;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
};

fs.rmSync(OUT, { recursive: true, force: true });
await rebuildHtml();

const ctx = await esbuild.context(esbuildOptions(true));
await ctx.watch();
const { port } = await ctx.serve({ servedir: OUT, port: PORT, host: '127.0.0.1' });

const onChange = debounce(rebuildHtml);
for (const p of ['wedding.config.js', 'src', 'photos', 'music', 'assets']) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full)) {
    fs.watch(full, { recursive: true }, onChange);
  }
}

console.log(`🌸 Thiệp đang chạy: http://localhost:${port}   (thử khách mẫu: http://localhost:${port}/?to=bac-hung)`);
