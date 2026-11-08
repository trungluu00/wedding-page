import { defineConfig } from 'vite';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { apiRouter } from './server/api.js';

export default defineConfig({
  plugins: [
    {
      name: 'wedding-api-middleware',
      configureServer(server) {
        // Serve google-apps-script.js as clean raw text without Vite module transform
        server.middlewares.use('/google-apps-script.js', (req, res) => {
          const scriptPath = path.resolve(process.cwd(), 'google-apps-script.js');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(fs.readFileSync(scriptPath, 'utf-8'));
        });

        const app = express();
        app.use(cors());
        app.use(express.json({ limit: '30mb' }));
        app.use(express.urlencoded({ extended: true, limit: '30mb' }));
        app.use(apiRouter);

        server.middlewares.use('/api', app);
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
