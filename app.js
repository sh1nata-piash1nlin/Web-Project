const express = require('express');
const path = require('path'); // Thêm dòng này
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const connectDB = require('./src/config/connectDB'); // Database connection
const authRouter = require('./src/routes/auth.route'); // Authentication routes
const guestRoutes = require('./src/routes/guest.route');
//const writerRoutes = require('./src/routes/writer.route');
const { engine } = require('express-handlebars'); // Import express-handlebars
const session = require('express-session');
const editorRoutes = require('./src/routes/editor.route');
const exphbs = require('express-handlebars');
const dayjs = require('dayjs');
var express_handlebars_sections = require('express-handlebars-sections');//import hbs sections
const FroalaEditor = require('wysiwyg-editor-node-sdk/lib/froalaEditor.js');

//const FroalaEditor = require('wysiwyg-editor-node-sdk/lib/froalaEditor.js');
//var express_handlebars_sections = require('express-handlebars-sections'); 

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

const helpers = {
    eq: (a, b) => a === b,
    includes: (array, value) => Array.isArray(array) && array.includes(value),
    formatDate: (date, format) => dayjs(date).format(format),
};

app.use('/static', express.static('src/static'));
app.use( express.static(path.join(__dirname, 'src', 'public')));
app.use('/froala', express.static(path.join(__dirname,'node_modules/froala-editor')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Configure Handlebars as the view engine
app.engine('hbs', engine({
    extname: '.hbs', // Use '.hbs' as the file extension for templates
    helpers, 
    // helpers: {
    //     format_number(val) {
    //       return numeral(val).format('0,0');
    //     },
    //     section: express_handlebars_sections()
    //   }
}));
app.set('view engine', 'hbs'); // Set the view engine to Handlebars
app.set('views', './src/views'); // Set the views directory



// Connect to the database
connectDB();



//Routes
const writerRoutes = require('./src/routes/writer.route.js');
app.use('/writer', writerRoutes);

app.use('/', guestRoutes);

app.use('/', editorRoutes);

//app.use('/', writerRoutes);
// Routes
app.use('/api/auth', authRouter); // Authentication routes (e.g., Google login)

// Debugging Google OAuth setup
// console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
// console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET);



// Start the server
const port = process.env.PORT || 8888;
app.listen(port, () => {
    console.log('Server is running on port ' + port);
});