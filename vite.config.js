import { defineConfig } from 'vite';
import weddingPlugin from './build/wedding-plugin.js';

// Trang tĩnh: nội dung + theme đọc từ wedding.config.js qua plugin build/wedding-plugin.js
export default defineConfig({
  plugins: [weddingPlugin()],
  server: {
    port: 5173,
    host: true,
    // Phương án B (huong-b/) có cách build riêng, Vite không cần theo dõi
    watch: { ignored: ['**/huong-b/**', '**/photos-preview/**'] },
  },
  // Chỉ quét index.html của phương án A (bỏ qua huong-b/ và bảng ảnh)
  optimizeDeps: { entries: ['index.html'] },
});
