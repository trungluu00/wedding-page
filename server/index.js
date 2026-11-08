import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// API routes
app.use('/api', apiRouter);

// Serve static frontend files in production
app.use(express.static(rootDir));

app.listen(PORT, () => {
  console.log(`✨ Backend API Server running at: http://localhost:${PORT}`);
  console.log(`📌 API Endpoints: http://localhost:${PORT}/api/wedding`);
});
