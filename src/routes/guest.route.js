const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest.controller');
const bcrypt = require('bcryptjs'); 
const userService = require('../services/user.service');
const upload = require('../utils/multer');
const app = express();
const sendOTPService = require('../services/otpMailer.service'); // Import OTP mailer service
const articleController = require('../controllers/article.controller');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Gọi hàm renderHomepage để hiển thị trang chủ

router.get('/', guestController.renderHomepage);


router.get('/login', async(req, res)=>{
    res.render('login.hbs',{
        layout: 'login-layout',
    })
})

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
      role: user.role === null ? 'guest' : user.role // If role is null, set to 'guest'
  };

  // Redirect based on role
  if (user.role === 'guest' || !user.role) {
      return res.redirect('/');
  } else if (user.role === 'editor') {
      return res.redirect('/editor');
  } else if (user.role === 'writer') {
      return res.redirect('/writer');
  } else if (user.role === 'admin') {
      return res.redirect('/admin');
  }
   else if (user.role === 'subscriber') {
    return res.redirect('/subscriber');
  }

});

router.get('/signup', async(req, res)=>{
    res.render('signup.hbs',{
        layout: 'login-layout',
    })
})

// Generate random captcha text with mixed case and numbers
function generateCaptcha() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;
    
    let captcha = '';
    
    // Ensure at least one of each type
    captcha += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    captcha += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    captcha += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // Fill the remaining 3 characters randomly from all possible characters
    for (let i = 0; i < 3; i++) {
        captcha += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the captcha string
    captcha = captcha.split('').sort(() => Math.random() - 0.5).join('');
    
    return captcha;
}

// Modify the signup route to redirect to captcha
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    // Check if email already exists
    const existingUser = await userService.findByUsername(email);
    if (existingUser) {
        return res.render('signup', {
            layout: 'login-layout',
            showErrors: true,
            errorMessage: 'This email is already registered.',
        });
    }

    // Generate captcha and store in session
    const captchaText = generateCaptcha();
    req.session.captcha = {
        text: captchaText,
        email: email,
        password: password
    };

    // Render captcha page
    res.render('captcha', {
        layout: 'login-layout',
        captchaText: captchaText,
        email: email,
        password: password
    });
});

// Add route for captcha verification
router.post('/signup/verify-captcha', async (req, res) => {
    const { userCaptcha, email, password } = req.body;
    
    // Verify captcha
    if (!req.session.captcha || userCaptcha !== req.session.captcha.text) {
        // Generate new captcha for the next attempt
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

    // Hash password and create user
    const hash_password = bcrypt.hashSync(password, 8);
    const entity = {
        email,
        password: hash_password,
    };

    // Add user to database
    await userService.add(entity);
    
    // Clear captcha session
    delete req.session.captcha;
    
    // Redirect to login
    res.redirect('/login');
});

// Add route for refreshing captcha
router.get('/signup/refresh-captcha', (req, res) => {
    const newCaptcha = generateCaptcha();
    
    // Initialize captcha session if it doesn't exist
    if (!req.session.captcha) {
        req.session.captcha = {};
    }
    
    // Update the captcha text
    req.session.captcha.text = newCaptcha;
    
    res.json({ captchaText: newCaptcha });
});

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

  res.render('profile.hbs', {
      layout: 'login-layout',
      user: req.session.authUser, 
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
      if (email) updates.email = email;
      if (full_name) updates.full_name = full_name;

      // Handle avatar upload
      if (req.file) {
          updates.avatar = `/static/img/${req.file.filename}`; // Relative path to 'static/img'
      }

      // Update the user in the database
      await userService.updateUser(userId, updates);
      
      req.session.isAuthenticated = true;
      // Update the session with new data
      req.session.authUser.email = email || req.session.authUser.email;
      req.session.authUser.avatar = updates.avatar || req.session.authUser.avatar;

      // Redirect back to the profile page to render the changes
      res.redirect('/profile');
  } catch (err) {
      console.error('Error updating profile:', err.message);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/login/forgotpwd', (req, res) => {
  res.render('forgotpwd.hbs',{
    layout: 'login-layout',
    }); // Renders the Forgot Password UI
});

router.post('/login/forgotpwd', async (req, res) => {
  const email = req.body.email;
  const user = await userService.findByUsername(email);

  if (!user) {
    return res.render('forgotpwd.hbs',  {
      showErrors: true,
      errorMessage: 'No account found with this email address.',
      layout: 'login-layout',
    });
  }

  // Generate OTP
  const otp = sendOTPService.generateOTP();

  // Store OTP and email in session
  req.session.resetEmail = email;
  req.session.otp = otp;

  try {
    // Send OTP to the user's email
    await sendOTPService.sendOTP(email, otp);
    res.redirect('/login/forgotpwd/otp', 
    ); // Redirect to OTP verification page
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
  res.render('otp.hbs', { email: req.session.resetEmail, layout:'login-layout', });
});

router.post('/login/forgotpwd/otp', async (req, res) => {
  const { otp } = req.body;

  if (req.session.otp && req.session.otp === otp) {
    // Clear OTP from session after successful verification
    req.session.otp = null;

    // Redirect to the Reset Password page
    return res.redirect('/login/forgotpwd/resetpwd');
  }

  res.render('otp.hbs', {
    showErrors: true,
    errorMessage: 'Invalid OTP. Please try again.',
  });
});

router.get('/login/forgotpwd/resetpwd', (req, res) => {
  res.render('resetpwd.hbs',{
    layout:'login-layout',
  });
});

router.post('/login/forgotpwd/resetpwd', async (req, res) => {
  const { password } = req.body;
  const hash_password = bcrypt.hashSync(password, 8);

  // Update the password in the database
  await userService.updatePassword(req.session.resetEmail, hash_password);

  // Clear session and redirect to login
  req.session.resetEmail = null;
  res.redirect('/login');
});

//Duong
router.get('/article/:id', articleController.getArticleDetail);
//Duong
router.get('/category/:id', articleController.getCategoryArticles);
//Duong  
router.get('/search', articleController.searchArticles);
// Route cho comments - có thể sử dụng bởi mọi user đã đăng nhập
router.post('/articles/comments', articleController.addComment);

router.get('/profile/changepwd', (req, res) => {
  if (!req.session.isAuthenticated) {
      return res.redirect('/login');
  }

  res.render('changepwd.hbs', {
      layout: 'login-layout',
      user: req.session.authUser, // Pass user info if needed
  });
});


router.post('/profile/changepwd', async (req, res) => {
  try {
      const userId = req.session.authUser.id; // Get user ID from session
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate if new passwords match
      if (newPassword !== confirmPassword) {
          return res.render('changepwd.hbs', {
              layout: 'login-layout',
              errorMessage: 'New passwords do not match.',
          });
      }

      // Fetch the current user from the database
      const user = await userService.findOne({ id: userId });

      // Verify the current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
          return res.render('changepwd.hbs', {
              layout: 'login-layout',
              errorMessage: 'Current password is incorrect.',
          });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password in the database
      await userService.updateUser(userId, { password: hashedPassword });

      // Redirect with a success message
      res.redirect('/profile');
  } catch (error) {
      console.error('Error updating password:', error.message);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/register-role', (req, res) => {
  if (!req.session.isAuthenticated) {
      return res.redirect('/login');
  }

  res.render('register-role',{
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

    if (role === 'editor') {
      res.redirect('/editor'); 
    } else if (role === 'admin') {
      res.redirect('/admin'); 
    } else if (role === 'writer') {
      res.redirect('/writer');
    } 
    else {
      res.redirect('/profile'); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while updating the user role.');
  }
});

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

        // Calculate subscription end date (7 days from now)
        const startDay = new Date();
        const expiryDate = new Date(startDay.getTime() + (7 * 24 * 60 * 60 * 1000));

        // Save premium subscription data
        await userService.addPremiumSubscription({
            user_id: userId,
            card_number,
            cvv,
            start_day: startDay
        });

        // Update user's role and subscription expiry
        await userService.updateSubscriptionExpiry(userId, expiryDate);

        // Update session
        req.session.authUser.role = 'subscriber';
        req.session.authUser.subscription_expiry = expiryDate;


        // Redirect to main page instead of /subscriber
        res.redirect('/');
    } catch (error) {
        console.error('Premium subscription error:', error);
        res.status(500).render('subscriber-form', {
            layout: 'login-layout',
            error: 'An error occurred during subscription. Please try again.'
        });
    }
});


module.exports = router;
