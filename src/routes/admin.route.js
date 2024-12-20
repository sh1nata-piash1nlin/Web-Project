const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const db = require('../config/database');
// Middleware kiểm tra admin đơn giản
// Routes
router.get('/', adminController.getDashboard);
router.get('/categories', adminController.getCategories);
router.post('/categories/add', adminController.addCategory);
module.exports = router;