const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Konfigurasi Kredensial Root untuk Setup Awal (Mengikuti IP sukses temanmu)
const dbHost = '34.50.74.33'; 
const myNIM = '2311523016';
const myDB = `db_${myNIM}`;
const myUser = `user_${myNIM}`;
const dbPassword = 'KomputasiAwan2026!';

// Fungsi Setup Otomatis saat Backend Menyala
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

                        // Gunakan Database yang baru dibuat
                        initPool.query(`USE ${myDB};`, (err) => {
                            if (err) console.error(err);

                            // Buat tabel rubiks (Menyesuaikan dengan schema Sequelize milik asisten)
                            const createTableQuery = `
                                CREATE TABLE IF NOT EXISTS rubiks (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    nama VARCHAR(255) NOT NULL,
                                    merek VARCHAR(255) NOT NULL,
                                    ukuran VARCHAR(255) NOT NULL,
                                    harga INT NOT NULL,
                                    is_magnetic TINYINT(1) DEFAULT 0,
                                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

// Jalankan inisialisasi database asli ke server asisten
initializeDatabase();

// Pool Utama Aplikasi menggunakan USER NIM kamu sendiri yang sudah di-grant aksesnya
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

// 2. ENDPOINT /schema (Format Panjang & Flat Sequelize Asli)
app.get('/schema', (req, res) => {
    res.json({
        "id": { "type": "INT(11)", "allowNull": false, "primaryKey": true, "autoIncrement": true, "comment": null, "defaultValue": null },
        "nama": { "type": "VARCHAR(255)", "allowNull": false, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": null },
        "merek": { "type": "VARCHAR(255)", "allowNull": false, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": null },
        "ukuran": { "type": "VARCHAR(255)", "allowNull": false, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": null },
        "harga": { "type": "INT(11)", "allowNull": false, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": null },
        "is_magnetic": { "type": "TINYINT(1)", "allowNull": true, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": "0" },
        "createdAt": { "type": "DATETIME", "allowNull": false, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": null },
        "updatedAt": { "type": "DATETIME", "allowNull": false, "primaryKey": false, "autoIncrement": false, "comment": null, "defaultValue": null }
    });
});

// 3. GET ALL DATA
app.get('/rubiks', (req, res) => {
    pool.query('SELECT * FROM rubiks', (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.json({ status: "success", data: results });
    });
});

// 4. POST DATA
app.post('/rubiks', (req, res) => {
    const { nama, merek, ukuran, harga, is_magnetic } = req.body;
    const magneticVal = is_magnetic ? 1 : 0;
    pool.query('INSERT INTO rubiks (nama, merek, ukuran, harga, is_magnetic) VALUES (?, ?, ?, ?, ?)',
    [nama, merek, ukuran, harga, magneticVal], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", data: { id: results.insertId, ...req.body } });
    });
});

// 5. PUT DATA
app.put('/rubiks/:id', (req, res) => {
    const { nama, merek, ukuran, harga, is_magnetic } = req.body;
    const magneticVal = is_magnetic ? 1 : 0;
    pool.query('UPDATE rubiks SET nama=?, merek=?, ukuran=?, harga=?, is_magnetic=? WHERE id=?',
    [nama, merek, ukuran, harga, magneticVal, req.params.id], (err) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.json({ status: "success" });
    });
});

// 6. DELETE DATA
app.delete('/rubiks/:id', (req, res) => {
    pool.query('DELETE FROM rubiks WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.json({ status: "success" });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server fully sync on port ${PORT}`);
});