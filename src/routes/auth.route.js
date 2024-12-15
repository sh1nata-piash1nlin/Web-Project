const router = require('express').Router();
const passport = require('passport');
require('dotenv').config();
const authController = require('../controllers/auth.controller');

// Route để bắt đầu xác thực với Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Route callback sau khi Google xác thực
router.get('/google/callback', 
    passport.authenticate('google', { session: false }), // Gán profile vào req.user
    (req, res) => {
        if (!req.user) {
            return res.redirect('/login-failure'); // Xử lý nếu không có user
        }
        // Điều hướng đến URL client với ID người dùng từ Google
        //  q res.redirect(`${process.env.URL_CLIENT}/login-success/${req.user.id}`);
        res.redirect('/');

    }
);



router.get('/facebook',
    passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false }))

// router.get('/facebook/callback', (req, res, next) => {
//     passport.authenticate('facebook', (err, profile) => {
//         req.user = profile
//         next()
//     })(req, res, next)
// }, (req, res) => {
//     res.redirect(`${process.env.URL_CLIENT}/login-success/${req.user?.id}/${req.user.tokenLogin}`)
// })

router.get('/facebook/callback', 
    passport.authenticate('facebook', { session: false }), 
    (req, res) => {
        if (!req.user) {
            return res.redirect('/login-failure'); 
        }
        res.redirect('/');
    }
);

router.post('/login-success', authController.loginSuccess);

module.exports = router;
