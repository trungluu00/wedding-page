import { defineConfig } from 'vite';
import weddingPlugin from './build/wedding-plugin.js';

// Trang tĩnh: nội dung + theme đọc từ wedding.config.js qua plugin build/wedding-plugin.js
export default defineConfig({
  plugins: [weddingPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
