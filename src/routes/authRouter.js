const router = require('express').Router()
const passport = require('passport')
require('dotenv').config()
const authController = require('../controllers/authController')

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false}));
  
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, profile) => {
        req.user = profile 
        console.log(req.user)
        next() 
        })(req, res, next)
}, (req, res) => {
    res.redirect(`${process.env.URL_CLIENT}/login-success/${req.user?.id}`)
})

router.post('/login-sucess', authController.loginSuccess)

module.exports = router 

