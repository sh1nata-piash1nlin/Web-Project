const express = require('express');
const path = require('path'); // Thêm dòng này
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const connectDB = require('./src/config/connectDB'); // Database connection
const authRouter = require('./src/routes/auth.route'); // Authentication routes
const guestRoutes = require('./src/routes/guest.route');
const { engine } = require('express-handlebars'); // Import express-handlebars
const session = require('express-session');
const adminRoutes = require('./src/routes/admin.route');

require('./passport'); // Passport setup
const app = express();

app.use(session({
    secret: 'secretKey',           // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }      // Use secure: true in production with HTTPS
}));

// Middleware to pass session variables to all views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isAuthenticated || false;
    res.locals.authUser = req.session.authUser || null;
    next();
});

// Enable CORS
app.use(cors({
    origin: process.env.URL_CLIENT, // Allow client URL specified in environment variables
}));
app.use('/static', express.static('src/static'));
app.use('/public', express.static(path.join(__dirname, 'src', 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Configure Handlebars as the view engine
app.engine('hbs', engine({
    extname: '.hbs', // Use '.hbs' as the file extension for templates
    //defaultLayout: 'main',
}));
app.set('view engine', 'hbs'); // Set the view engine to Handlebars
app.set('views', './src/views'); // Set the views directory



// Connect to the database
connectDB();


app.use('/', guestRoutes);
app.use('/admin', adminRoutes);

// Routes
app.use('/api/auth', authRouter); // Authentication routes (e.g., Google login)

// Debugging Google OAuth setup
// console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
// console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET);

// Render the login page
// app.get('/login', (req, res) => {
//     res.render('login',{layout: false}); // Render the login.hbs file in the views directory
// });

// Render the dashboard page
// app.get('/dashboard', (req, res) => {
//     res.render('dashboard'); // Render the dashboard.hbs file in the views directory
// }); 


// Start the server
const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});