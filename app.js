const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const connectDB = require('./src/config/connectDB'); // Database connection
const authRouter = require('./src/routes/auth.route'); // Authentication routes
const guestRoutes = require('./src/routes/guest.route');
const { engine } = require('express-handlebars'); // Import express-handlebars

require('./passport'); // Passport setup

const app = express();

// Enable CORS
app.use(cors({
    origin: process.env.URL_CLIENT, // Allow client URL specified in environment variables
}));

// Middleware to parse JSON and URL-encoded data
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
