const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || '34.101.108.193',
  user: process.env.DB_USER || 'user_2311523016',
  password: process.env.DB_PASSWORD || 'KomputasiAwan2026!',
  database: process.env.DB_NAME || 'db_2311523016',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Otomatis membuat tabel rubiks saat server menyala
pool.query(`
  CREATE TABLE IF NOT EXISTS rubiks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    is_magnetic BOOLEAN DEFAULT FALSE
  )
`).then(() => console.log("Table 'rubiks' is ready and integrated beautifully.")).catch(err => console.error(err));

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({ status: "success", message: "Welcome to Rubik REST API" });
});

// Endpoint Health Check sesuai spesifikasi kamu
app.get('/health', async (req, res) => {
  let dbStatus = "disconnected";
  try {
    const connection = await pool.getConnection();
    dbStatus = "connected";
    connection.release();
  } catch (error) {
    console.error("Health check database error:", error.message);
  }

  res.json({
    status: dbStatus === "connected" ? "success" : "error",
    message: dbStatus === "connected" ? "Backend is running" : "Backend running, database disconnected",
    database: dbStatus,
    student: {
      name: "Muhammad Ardra Pramana AS",
      nim: "2311523016"
    }
  });
});

// Endpoint Schema sesuai spesifikasi kolom Rubik kamu
app.get('/schema', (req, res) => {
  res.json({
    student: { name: "Muhammad Ardra Pramana AS", nim: "2311523016" },
    resource: {
      name: "rubiks",
      label: "Data Rubik",
      description: "Aplikasi untuk mengelola data koleksi Rubik"
    },
    fields: [
      { name: "name", label: "Nama Rubik", type: "text", required: true, showInTable: true },
      { name: "brand", label: "Merek", type: "text", required: true, showInTable: true },
      { name: "type", label: "Jenis (Size)", type: "text", required: true, showInTable: true },
      { name: "price", label: "Harga", type: "number", required: true, showInTable: true },
      { name: "is_magnetic", label: "Magnetic", type: "boolean", required: false, showInTable: true }
    ],
    endpoints: {
      list: "/rubiks",
      detail: "/rubiks/{id}",
      create: "/rubiks",
      update: "/rubiks/{id}",
      delete: "/rubiks/{id}"
    }
  });
});

// ==================== CRUD ENDPOINTS FOR RUBIKS ====================

app.get('/rubiks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rubiks');
    res.json({ status: "success", message: "Data retrieved successfully", data: rows });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

app.get('/rubiks/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rubiks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: "error", message: "Rubik not found" });
    res.json({ status: "success", message: "Data retrieved successfully", data: rows[0] });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

app.post('/rubiks', async (req, res) => {
  try {
    const { name, brand, type, price, is_magnetic } = req.body;
    const [result] = await pool.query(
      'INSERT INTO rubiks (name, brand, type, price, is_magnetic) VALUES (?, ?, ?, ?, ?)',
      [name, brand, type, parseInt(price), is_magnetic ? 1 : 0]
    );
    res.status(201).json({
      status: "success",
      message: "Data created successfully",
      data: { id: result.insertId, name, brand, type, price, is_magnetic }
    });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

app.put('/rubiks/:id', async (req, res) => {
  try {
    const { name, brand, type, price, is_magnetic } = req.body;
    const [rows] = await pool.query('SELECT * FROM rubiks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: "error", message: "Rubik not found" });

    await pool.query(
      'UPDATE rubiks SET name = ?, brand = ?, type = ?, price = ?, is_magnetic = ? WHERE id = ?',
      [name, brand, type, parseInt(price), is_magnetic ? 1 : 0, req.params.id]
    );
    res.json({
      status: "success",
      message: "Data updated successfully",
      data: { id: parseInt(req.params.id), name, brand, type, price, is_magnetic }
    });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

app.delete('/rubiks/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rubiks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ status: "error", message: "Rubik not found" });

    await pool.query('DELETE FROM rubiks WHERE id = ?', [req.params.id]);
    res.json({ status: "success", message: "Data deleted successfully" });
  } catch (error) { res.status(500).json({ status: "error", message: error.message }); }
});

// Menjalankan Server di port 8080 (Standar Cloud Run Google)
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running beautifully on http://0.0.0.0:${PORT}`);
});