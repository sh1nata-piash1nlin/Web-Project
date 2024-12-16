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

router.get('/signup', async(req, res)=>{
    res.render('signup.hbs',{
        layout: 'login-layout',
    })
})

router.post('/signup', async(req, res)=>{
    const hash_password = bcrypt.hashSync(req.body.password, 8)
    const entity = {
        email: req.body.email, 
        password: hash_password,
    }
    console.log(entity);
    const ret = await userService.add(entity);
    res.redirect('/login');

})


module.exports = router;