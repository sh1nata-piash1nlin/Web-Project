const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriber.controller');

// Middleware to check if user is subscriber
const checkSubscriber = (req, res, next) => {
    if (req.session.authUser && req.session.authUser.role === 'subscriber') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Apply middleware to all routes
router.use(checkSubscriber);

// Routes
router.get('/', subscriberController.renderSubscriberHomepage);
router.get('/article/:id', subscriberController.getArticleDetailPremium);
router.get('/category/:id', subscriberController.getCategoryArticlesPremium);
router.get('/search', subscriberController.searchArticlesPremium);
router.get('/article/:id/download', subscriberController.downloadArticlePDF);

module.exports = router; 