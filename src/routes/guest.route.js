const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest.controller');
const bcrypt = require('bcryptjs'); 
const userService = require('../services/user.service');
const upload = require('../utils/multer');
const app = express();
const sendOTPService = require('../services/otpMailer.service');
const articleController = require('../controllers/article.controller');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage
router.get('/', guestController.renderHomepage);

// Login routes
router.get('/login', async(req, res) => {
    res.render('login.hbs', {
        layout: 'login-layout',
    });
});

router.post('/login', async function (req, res) {
    const user = await userService.findByUsername(req.body.email);
    if (!user) {
        return res.render('login', {
            layout: 'login-layout',
            showErrors: true,
        });
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
        return res.render('login', {
            layout: 'login-layout',
            showErrors: true
        });
    }

    req.session.isAuthenticated = true;
    req.session.authUser = {
        id: user.id,
        email: user.email,
        avatar: user.avatar || '/static/img/default.png',
        role: user.role === null ? 'guest' : user.role
    };

    // Role-based redirects
    if (user.role === 'subscriber') {
        return res.redirect('/subscriber');
    } else if (user.role === 'editor') {
        return res.redirect('/editor');
    } else if (user.role === 'writer') {
        return res.redirect('/writer');
    } else if (user.role === 'admin') {
        return res.redirect('/admin');
    } else {
        return res.redirect('/');
    }
});

// Signup routes
router.get('/signup', async(req, res) => {
    res.render('signup.hbs', {
        layout: 'login-layout',
    });
});

function generateCaptcha() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;

    let captcha = '';
    captcha += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    captcha += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    captcha += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    for (let i = 0; i < 3; i++) {
        captcha += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    return captcha.split('').sort(() => Math.random() - 0.5).join('');
}

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await userService.findByUsername(email);
    
    if (existingUser) {
        return res.render('signup', {
            layout: 'login-layout',
            showErrors: true,
            errorMessage: 'This email is already registered.',
        });
    }

    const captchaText = generateCaptcha();
    req.session.captcha = {
        text: captchaText,
        email: email,
        password: password
    };

    res.render('captcha', {
        layout: 'login-layout',
        captchaText: captchaText,
        email: email,
        password: password
    });
});

router.post('/signup/verify-captcha', async (req, res) => {
    const { userCaptcha, email, password } = req.body;

    if (!req.session.captcha || userCaptcha !== req.session.captcha.text) {
        const newCaptcha = generateCaptcha();
        req.session.captcha = {
            text: newCaptcha,
            email: email,
            password: password
        };

        return res.render('captcha', {
            layout: 'login-layout',
            captchaText: newCaptcha,
            email: email,
            password: password,
            showErrors: true,
            errorMessage: 'Invalid captcha. Please try again.'
        });
    }

    const hash_password = bcrypt.hashSync(password, 8);
    await userService.add({ email, password: hash_password });
    delete req.session.captcha;
    res.redirect('/login');
});

router.get('/signup/refresh-captcha', (req, res) => {
    const newCaptcha = generateCaptcha();
    if (!req.session.captcha) {
        req.session.captcha = {};
    }
    req.session.captcha.text = newCaptcha;
    res.json({ captchaText: newCaptcha });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout failed:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Profile routes
router.get('/profile', async (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }
    res.render('profile.hbs', {
        layout: 'login-layout',
        user: req.session.authUser,
    });
});

router.post('/profile', upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.session.authUser.id;
        if (!userId) {
            return res.status(400).send('User not authenticated');
        }

        const { email, full_name } = req.body;
        const updates = {};

        if (email) updates.email = email;
        if (full_name) updates.full_name = full_name;
        if (req.file) {
            updates.avatar = `/static/img/${req.file.filename}`;
        }

        await userService.updateUser(userId, updates);
        
        req.session.isAuthenticated = true;
        req.session.authUser.email = email || req.session.authUser.email;
        req.session.authUser.avatar = updates.avatar || req.session.authUser.avatar;

        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Password management routes
router.get('/profile/changepwd', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }
    res.render('changepwd.hbs', {
        layout: 'login-layout',
        user: req.session.authUser,
    });
});

router.post('/profile/changepwd', async (req, res) => {
    try {
        const userId = req.session.authUser.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.render('changepwd.hbs', {
                layout: 'login-layout',
                errorMessage: 'New passwords do not match.',
            });
        }

        const user = await userService.findOne({ id: userId });
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!passwordMatch) {
            return res.render('changepwd.hbs', {
                layout: 'login-layout',
                errorMessage: 'Current password is incorrect.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userService.updateUser(userId, { password: hashedPassword });
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating password:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Forgot password flow
router.get('/login/forgotpwd', (req, res) => {
    res.render('forgotpwd.hbs', {
        layout: 'login-layout',
    });
});

router.post('/login/forgotpwd', async (req, res) => {
    const email = req.body.email;
    const user = await userService.findByUsername(email);

    if (!user) {
        return res.render('forgotpwd.hbs', {
            showErrors: true,
            errorMessage: 'No account found with this email address.',
            layout: 'login-layout',
        });
    }

    const otp = sendOTPService.generateOTP();
    req.session.resetEmail = email;
    req.session.otp = otp;

    try {
        await sendOTPService.sendOTP(email, otp);
        res.redirect('/login/forgotpwd/otp');
    } catch (err) {
        console.error('Failed to send OTP:', err.message);
        res.render('forgotpwd.hbs', {
            showErrors: true,
            errorMessage: 'Failed to send OTP. Please try again.',
            layout: 'login-layout',
        });
    }
});

router.get('/login/forgotpwd/otp', (req, res) => {
    res.render('otp.hbs', {
        email: req.session.resetEmail,
        layout: 'login-layout',
    });
});

router.post('/login/forgotpwd/otp', async (req, res) => {
    const { otp } = req.body;

    if (req.session.otp && req.session.otp === otp) {
        req.session.otp = null;
        return res.redirect('/login/forgotpwd/resetpwd');
    }

    res.render('otp.hbs', {
        showErrors: true,
        errorMessage: 'Invalid OTP. Please try again.',
    });
});

router.get('/login/forgotpwd/resetpwd', (req, res) => {
    res.render('resetpwd.hbs', {
        layout: 'login-layout',
    });
});

router.post('/login/forgotpwd/resetpwd', async (req, res) => {
    const { password } = req.body;
    const hash_password = bcrypt.hashSync(password, 8);
    await userService.updatePassword(req.session.resetEmail, hash_password);
    req.session.resetEmail = null;
    res.redirect('/login');
});

// Role management
router.get('/register-role', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }
    res.render('register-role', {
        layout: 'login-layout'
    });
});

router.post('/register-role', async (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }

    const { role } = req.body;
    const userId = req.session.authUser.id;

    try {
        await userService.updateUser(userId, { role });
        req.session.authUser.role = role;

        switch(role) {
            case 'editor':
                res.redirect('/editor');
                break;
            case 'admin':
                res.redirect('/admin');
                break;
            case 'writer':
                res.redirect('/writer');
                break;
            default:
                res.redirect('/profile');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while updating the user role.');
    }
});

// Premium subscription
router.get('/premium', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }
    res.render('subscriber-form', {
        title: 'Register as Subscriber',
        layout: 'login-layout',
    });
});

router.post('/premium', async (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/login');
    }

    try {
        const userId = req.session.authUser.id;
        const { card_number, cvv, full_name, email } = req.body;

        const startDay = new Date();
        const expiryDate = new Date(startDay.getTime() + (7 * 24 * 60 * 60 * 1000));

        await userService.addPremiumSubscription({
            user_id: userId,
            card_number,
            cvv,
            start_day: startDay
        });

        await userService.updateSubscriptionExpiry(userId, expiryDate);

        req.session.authUser.role = 'subscriber';
        req.session.authUser.subscription_expiry = expiryDate;

        res.redirect('/');
    } catch (error) {
        console.error('Premium subscription error:', error);
        res.status(500).render('subscriber-form', {
            layout: 'login-layout',
            error: 'An error occurred during subscription. Please try again.'
        });
    }
});

// Article routes
router.get('/article/:id', articleController.getArticleDetail);
router.get('/category/:id', articleController.getCategoryArticles);
router.get('/search', articleController.searchArticles);
router.post('/articles/comments', articleController.addComment);

module.exports = router;