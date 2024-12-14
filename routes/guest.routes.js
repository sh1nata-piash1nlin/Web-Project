// routes/guest.routes.js
const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest.controller');

// Gọi hàm renderHomepage để hiển thị trang chủ
router.get('/', guestController.renderHomepage);

module.exports = router;
