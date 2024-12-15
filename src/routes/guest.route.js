const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest.controller');

// Gọi hàm renderHomepage để hiển thị trang chủ
router.get('/', guestController.renderHomepage);

router.get('/login', async(req, res)=>{
    res.render('login.hbs',{
        layout: 'login-layout',
    })
})

module.exports = router;