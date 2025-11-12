// server.js  (ESM)
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== 靜態頁 =====
// 假設你的檔案在 backend/public/login/index.html 與 backend/public/admin/index.html
app.use('/login', express.static(path.join(__dirname, 'public/login')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// 讓 / 直接導到 /login
app.get('/', (req, res) => res.redirect('/login'));

// ===== 登入 API（你原本的三條保留）=====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  res.json({ success: username === 'test' && password === '1234' });
});

app.post('/api/seller-login', (req, res) => {
  const { username, password } = req.body;
  res.json({ success: username === 'seller' && password === 'seller123' });
});

app.post('/api/admin-login', (req, res) => {
  const { username, password } = req.body;
  res.json({ success: username === 'admin' && password === 'admin123' });
});

// 健康檢查
app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
