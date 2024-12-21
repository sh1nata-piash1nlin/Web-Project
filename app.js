const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/connectDB');
const authRouter = require('./src/routes/auth.route');
const guestRoutes = require('./src/routes/guest.route');
const editorRoutes = require('./src/routes/editor.route');
const { engine } = require('express-handlebars');
const session = require('express-session');
const subscriberRouter = require('./src/routes/subscriber.route');
const dayjs = require('dayjs');

require('./passport');

const app = express();

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Middleware to pass session variables to all views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isAuthenticated || false;
    res.locals.authUser = req.session.authUser || null;
    next();
});

// Enable CORS
app.use(cors({
    origin: process.env.URL_CLIENT,
}));

// Handlebars helpers
const helpers = {
    eq: (a, b) => a === b,
    includes: (array, value) => Array.isArray(array) && array.includes(value),
    formatDate: (date, format) => dayjs(date).format(format),
};

// Static files
app.use('/static', express.static('src/static'));
app.use('/public', express.static(path.join(__dirname, 'src', 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Handlebars
app.engine('hbs', engine({
    extname: '.hbs',
    helpers
}));
app.set('view engine', 'hbs');
app.set('views', './src/views');

// Connect to database
connectDB();

// Routes
app.use('/', guestRoutes);
app.use('/', editorRoutes);
app.use('/api/auth', authRouter);
app.use('/subscriber', subscriberRouter);

// Error handling
app.use((req, res, next) => {
    res.status(404).render('404', { layout: 'main' });
});

// Start server
const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});

module.exports = app;