const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Kredensial Database Terpusat MariaDB Asisten
const dbHost = '34.101.108.193'; 
const myNIM = '2311523016';
const myDB = `db_${myNIM}`;
const myUser = `user_${myNIM}`;
const dbPassword = 'KomputasiAwan2026!';

// Fungsi Setup Otomatis Saat Kontainer Dinyalakan
function initializeDatabase() {
    const initPool = mysql.createConnection({
        host: dbHost,
        user: 'root',
        password: dbPassword
    });

    initPool.connect((err) => {
        if (err) {
            console.error("Gagal konek sebagai root untuk setup:", err.message);
            return;
        }
        console.log("Connected to MariaDB as root. Menjalankan migrasi database...");

        initPool.query(`CREATE DATABASE IF NOT EXISTS ${myDB};`, (err) => {
            if (err) console.error(err);
            initPool.query(`CREATE USER IF NOT EXISTS '${myUser}'@'%' IDENTIFIED BY '${dbPassword}';`, (err) => {
                if (err) console.error(err);
                initPool.query(`GRANT ALL PRIVILEGES ON ${myDB}.* TO '${myUser}'@'%';`, (err) => {
                    if (err) console.error(err);
                    initPool.query(`FLUSH PRIVILEGES;`, (err) => {
                        if (err) console.error(err);
                        initPool.query(`USE ${myDB};`, (err) => {
                            if (err) console.error(err);
                            
                            const createTableQuery = `
                                CREATE TABLE IF NOT EXISTS rubiks (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    nama VARCHAR(255) NOT NULL,
                                    merek VARCHAR(255) NOT NULL,
                                    ukuran VARCHAR(255) NOT NULL,
                                    harga INT NOT NULL,
                                    is_magnetic TINYINT(1) DEFAULT 0
                                );
                            `;
                            initPool.query(createTableQuery, (err) => {
                                if (err) console.error("Gagal membuat tabel:", err.message);
                                else console.log(`Database ${myDB} dan tabel 'rubiks' siap digunakan!`);
                                initPool.end();
                            });
                        });
                    });
                });
            });
        });
    });
}

initializeDatabase();

// Hubungkan Pool Aplikasi Utama Menggunakan User NIM Anda
const pool = mysql.createPool({
    host: dbHost,
    user: myUser,
    password: dbPassword,
    database: myDB,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 1. ENDPOINT /health
app.get('/health', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({
                status: "error",
                database: "disconnected",
                error_message: err.message,
                owner: { nama: "Muhammad Ardra Pramana AS", nim: myNIM }
            });
        }
        connection.release();
        res.json({
            status: "success",
            database: "connected",
            owner: { nama: "Muhammad Ardra Pramana AS", nim: myNIM }
        });
    });
});

// 2. ENDPOINT /schema (DIUBAH TOTAL 100% SESUAI DENGAN FORMAT DOKUMEN ASISTEN)
app.get('/schema', (req, res) => {
    res.json({
        "student": {
            "name": "Muhammad Ardra Pramana AS",
            "nim": myNIM
        },
        "resource": {
            "name": "rubiks",
            "label": "Data Koleksi Rubik",
            "description": "Aplikasi untuk mengelola data koleksi Rubik"
        },
        "fields": [
            { "name": "nama", "label": "Nama Rubik", "type": "text", "required": true, "showInTable": true },
            { "name": "merek", "label": "Merek/Brand", "type": "text", "required": true, "showInTable": true },
            { "name": "ukuran", "label": "Ukuran (Jenis)", "type": "text", "required": true, "showInTable": true },
            { "name": "harga", "label": "Harga (Rp)", "type": "number", "required": true, "showInTable": true },
            { "name": "is_magnetic", "label": "Magnetic Feature", "type": "boolean", "required": false, "showInTable": true }
        ],
        "endpoints": {
            "list": "/items",
            "detail": "/items/{id}",
            "create": "/items",
            "update": "/items/{id}",
            "delete": "/items/{id}"
        }
    });
});

// --- IMPLEMENTASI ROUTE CRUD MENGGUNAKAN PATH /items SESUAI INSTRUKSI ---

// 3. GET ALL DATA ITEMS
app.get('/items', (req, res) => {
    pool.query('SELECT * FROM rubiks', (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        // Map data agar boolean formatnya ramah untuk komponen checkbox frontend
        const formattedData = results.map(row => ({
            ...row,
            is_magnetic: row.is_magnetic === 1
        }));
        res.json({ status: "success", data: formattedData });
    });
});

// 4. GET SINGLE ITEM BY ID
app.get('/items/:id', (req, res) => {
    pool.query('SELECT * FROM rubiks WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) return res.status(404).json({ status: "error", message: "Item tidak ditemukan" });
        
        const row = results[0];
        row.is_magnetic = row.is_magnetic === 1;
        res.json({ status: "success", data: row });
    });
});

// 5. POST CREATE ITEM
app.post('/items', (req, res) => {
    const { nama, merek, ukuran, harga, is_magnetic } = req.body;
    const magneticVal = is_magnetic ? 1 : 0;
    
    pool.query('INSERT INTO rubiks (nama, merek, ukuran, harga, is_magnetic) VALUES (?, ?, ?, ?, ?)',
    [nama, merek, ukuran, parseInt(harga), magneticVal], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", data: { id: results.insertId, ...req.body } });
    });
});

// 6. PUT UPDATE ITEM
app.put('/items/:id', (req, res) => {
    const { nama, merek, ukuran, harga, is_magnetic } = req.body;
    const magneticVal = is_magnetic ? 1 : 0;
    
    pool.query('UPDATE rubiks SET nama=?, merek=?, ukuran=?, harga=?, is_magnetic=? WHERE id=?',
    [nama, merek, ukuran, parseInt(harga), magneticVal, req.params.id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.json({ status: "success" });
    });
});

// 7. DELETE ITEM
app.delete('/items/:id', (req, res) => {
    pool.query('DELETE FROM rubiks WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.json({ status: "success" });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server fully sync on port ${PORT}`);
});