const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
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

//tag
router.get('/tags', adminController.getTags);
router.post('/tags', adminController.addTag);
router.get('/tags/:id', adminController.getTagById);
router.put('/tags/:id', adminController.updateTag);
router.delete('/tags/:id', adminController.deleteTag);
//article
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });
// Articles routes
router.get('/articles', adminController.getArticles);
router.post('/articles', upload.single('thumbnail'), adminController.addArticle);
router.get('/articles/:id', adminController.getArticleById);
router.put('/articles/:id', upload.single('thumbnail'), adminController.updateArticle);
router.delete('/articles/:id', adminController.deleteArticle);
module.exports = router;