const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guest.controller');
const bcrypt = require('bcryptjs'); 
const userService = require('../services/user.service');
const app = express();

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
        email: user.email,
        avatar: user.avatar || '/static/img/default.png' // Use default avatar if none provided
    };

    res.redirect('/');
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


module.exports = router;
