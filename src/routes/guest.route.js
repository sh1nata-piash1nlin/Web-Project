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
      role: user.role === null ? 'guest' : user.role
  };

  // Redirect based on role
  if (user.role === 'subscriber') {
      return res.redirect('/subscriber');
  } else if (user.role === 'editor') {
      return res.redirect('/editor');
  } else if (user.role === 'writer') {
      return res.redirect('/writer');
  } else if (user.role === 'admin') {
      return res.redirect('/admin');
  } else {
      // Default redirect for guest or undefined roles
      return res.redirect('/');
  }
});

router.get('/signup', async(req, res)=>{
    res.render('signup.hbs',{
        layout: 'login-layout',
    })
})

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  // Check if email already exists in the database
  const existingUser = await userService.findByUsername(email);
  if (existingUser) {
      // If email already exists, show an alert and re-render the signup page
      return res.render('signup', {
          layout: 'login-layout',
          showErrors: true,
          errorMessage: 'This email is already registered.',
      });
  }

  // Hash password before storing it
  const hash_password = bcrypt.hashSync(password, 8);
  const entity = {
      email,
      password: hash_password,
  };

  // Insert new user into the database
  await userService.add(entity);
  res.redirect('/login');
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


// Forgot Password - Render UI
router.get('/login/forgotpwd', (req, res) => {
  res.render('forgotpwd.hbs',{
    layout: 'login-layout',
    }); // Renders the Forgot Password UI
});

// Forgot Password - Handle Email Submission
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




// Render OTP Page
router.get('/login/forgotpwd/otp', (req, res) => {
  res.render('otp.hbs', { email: req.session.resetEmail, layout:'login-layout', });
});

// Handle OTP Verification (Mock OTP for simplicity)
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

// Render Reset Password Page
router.get('/login/forgotpwd/resetpwd', (req, res) => {
  res.render('resetpwd.hbs',{
    layout:'login-layout',
  });
});

// Handle Reset Password Submission
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

module.exports = router;