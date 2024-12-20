const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const db = require('../config/database');
// Middleware kiểm tra admin đơn giản
// Routes
router.get('/', adminController.getDashboard);
router.get('/categories', adminController.getCategories);
router.post('/categories/add', adminController.addCategory);
router.get('/categories/:id', adminController.getCategoryById);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
module.exports = router;