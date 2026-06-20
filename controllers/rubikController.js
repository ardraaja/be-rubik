const Rubik = require('../models/rubik');
const sequelize = require('../config/database');
require('dotenv').config();

const getHealth = async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      status: "success",
      message: "Backend is running",
      database: "connected",
      student: {
        name: process.env.STUDENT_NAME,
        nim: process.env.STUDENT_NIM
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Backend is running, but database is not connected",
      database: "disconnected",
      student: {
        name: process.env.STUDENT_NAME,
        nim: process.env.STUDENT_NIM
      }
    });
  }
};

const getSchema = (req, res) => {
  res.status(200).json({
    student: { 
      name: process.env.STUDENT_NAME, 
      nim: process.env.STUDENT_NIM
    },
    resource: {
      name: "rubiks",
      label: "Data Rubik",
      description: "Aplikasi untuk mengelola data koleksi Rubik",
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
    }
  });
};

const getAllRubiks = async (req, res) => {
  try {
    const data = await Rubik.findAll();
    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      data: data
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getRubikById = async (req, res) => {
  try {
    const data = await Rubik.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data not found" });
    
    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      data: data
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const createRubik = async (req, res) => {
  try {
    const { name, brand, type, price, is_magnetic } = req.body;
    const newData = await Rubik.create({ name, brand, type, price, is_magnetic });
    res.status(201).json({
      status: "success",
      message: "Data created successfully",
      data: newData
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const updateRubik = async (req, res) => {
  try {
    const { name, brand, type, price, is_magnetic } = req.body;
    const data = await Rubik.findByPk(req.params.id);
    
    if (!data) return res.status(404).json({ status: "error", message: "Data not found" });

    await data.update({ name, brand, type, price, is_magnetic });
    res.status(200).json({
      status: "success",
      message: "Data updated successfully",
      data: data
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const deleteRubik = async (req, res) => {
  try {
    const data = await Rubik.findByPk(req.params.id);
    if (!data) return res.status(404).json({ status: "error", message: "Data not found" });

    await data.destroy();
    res.status(200).json({
      status: "success",
      message: "Data deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getHealth,
  getSchema,
  getAllRubiks,
  getRubikById,
  createRubik,
  updateRubik,
  deleteRubik
};