
const router = require('express').Router();
const passport = require('passport');
require('dotenv').config();
const authController = require('../controllers/auth.controller');
const upload = require('../utils/multer');

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

        req.session.isAuthenticated = true;

        req.session.authUser = {
            id: req.user.id, // Assign the user's ID from the authentication process
            avatar: req.user.avatar || '/static/img/default.png' // Assign user's avatar if available
        };
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

        req.session.isAuthenticated = true;

        req.session.authUser = {
            id: req.user.id, // Assign the user's ID from the authentication process
            avatar: req.user.avatar || '/static/img/default.png' // Assign user's avatar if available
        };
        res.redirect('/');
    }
);

router.post('/login-success', authController.loginSuccess);

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout failed:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});


router.get('/profile', async (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }

    const user = req.session.authUser;

    res.render('profile-oauth', {
        layout: 'login-layout',
        user: req.session.authUser, // Pass user data (email, avatar) to the template
    });
});

router.post('/profile', upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.session.authUser.id; // Get the user's id from session
        if (!userId) {
            return res.status(400).send('User not authenticated');
        }

        const { email, full_name } = req.body;
        const updates = {};

        // Update email and full_name if provided
        //if (email) updates.email = email;
        if (full_name) updates.full_name = full_name;

        // Handle avatar upload
        if (req.file) {
            updates.avatar = `/static/img/${req.file.filename}`; // Relative path to 'static/img'
        }

        // Update the user in the database
        await userService.updateUser(userId, updates);

        req.session.isAuthenticated = true;
        // Update the session with new data
        //req.session.authUser.email = email || req.session.authUser.email;
        req.session.authUser.avatar = updates.avatar || req.session.authUser.avatar;

        // Redirect back to the profile page to render the changes
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;

