/**
 * Chọn phương án thiệp để chạy / build:
 *   - Phương án A: giao diện "Song Hỷ Xanh" (album lật trang 3D, lời chúc bay…) — thư mục gốc
 *   - Phương án B: giao diện dựa trên dewanakl/undangan — thư mục huong-b/
 *
 * Chọn bằng (ưu tiên từ trên xuống):
 *   1. tham số dòng lệnh:   npm run dev -- b      /  npm run build -- a
 *   2. biến môi trường:     PHUONG_AN=b npm run build
 *   3. `phuongAn` trong wedding.config.js (mặc định "a")
 *
 * Cả hai phương án build ra cùng thư mục dist/ (thứ được deploy lên Cloudflare Pages / Vercel / Amplify).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_DIR = path.join(ROOT, 'huong-b');
const DIST = path.join(ROOT, 'dist');

// node scripts/phuong-an.mjs <dev|build> [a|b] [tham số khác…]
// Tham số khác (vd --port 5191 --strictPort) được chuyển tiếp cho Vite (A); với B, --port thành biến PORT.
const [, , command = 'dev', ...rest] = process.argv;
const argVariant = /^[ab]$/i.test(rest[0] || '') ? rest.shift() : '';
const extraArgs = rest;
const config = (await import(pathToFileURL(path.join(ROOT, 'wedding.config.js')).href)).default;
const variant = String(argVariant || process.env.PHUONG_AN || config.phuongAn || 'a').trim().toLowerCase();

if (!['a', 'b'].includes(variant)) {
  console.error(`Phương án không hợp lệ: "${variant}" (chỉ "a" hoặc "b").`);
  process.exit(1);
}
if (!['dev', 'build'].includes(command)) {
  console.error(`Lệnh không hợp lệ: "${command}" (chỉ "dev" hoặc "build").`);
  process.exit(1);
}

const run = (cmd, args, cwd = ROOT, env = process.env) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} thoát với mã ${code}`))));
  });

console.log(`▶ Phương án ${variant.toUpperCase()} — ${command === 'dev' ? 'chạy thử trên máy' : 'build ra dist/'}`);

try {
  if (variant === 'a') {
    await run('npx', [...(command === 'dev' ? ['vite'] : ['vite', 'build']), ...extraArgs]);
  } else {
    if (!fs.existsSync(path.join(B_DIR, 'node_modules'))) {
      console.log('Cài thư viện cho phương án B (lần đầu)…');
      await run('npm', ['install'], B_DIR);
    }
    if (command === 'dev') {
      const portIdx = extraArgs.indexOf('--port');
      const port = portIdx >= 0 ? extraArgs[portIdx + 1] : '';
      await run('npm', ['run', 'dev'], B_DIR, port ? { ...process.env, PORT: port } : process.env);
    } else {
      await run('npm', ['run', 'build'], B_DIR);
      // Phương án B build ra huong-b/public → chép sang dist/ để cách deploy giống nhau
      fs.rmSync(DIST, { recursive: true, force: true });
      fs.cpSync(path.join(B_DIR, 'public'), DIST, { recursive: true });
      console.log('✓ Đã chép huong-b/public → dist/');
    }
  }
} catch (err) {
  console.error('✗', err.message);
  process.exit(1);
}
