import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// --- MySQL Pool ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

// --- 靜態頁：/login 與 /admin ---
app.use('/login', express.static(path.join(__dirname, 'public/login')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// 預設導向
app.get('/', (req, res) => res.redirect('/login'));

// --- API：登入 ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

        const [rows] = await pool.query('SELECT * FROM users WHERE email=? LIMIT 1', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        // Demo：不做 JWT，直接回基本資訊
        res.json({ id: user.id, email: user.email, role: user.role });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- API：取得使用者列表（給 admin 頁面）---
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY id DESC');
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- API：新增使用者（帳號管理頁可能會用到）---
app.post('/api/users', async (req, res) => {
    try {
        const { email, password, role = 'user' } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
        const hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [email, hash, role]);
        res.status(201).json({ ok: true });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email exists' });
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    console.log('Backend running on :' + port);
});
