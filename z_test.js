const express = require('express'); // Import Express
const { engine } = require('express-handlebars'); // Import Handlebars engine
const path = require('path');
var express_handlebars_sections = require('express-handlebars-sections');//import hbs sections
const FroalaEditor = require('wysiwyg-editor-node-sdk/lib/froalaEditor.js');


const app = express(); // Create an Express app

// Set up the Handlebars engine
app.engine('hbs', engine({
    extname: '.hbs',
    helpers: {
        format_number(val) {
          return numeral(val).format('0,0');
        },
        section: express_handlebars_sections()
      }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For parsing JSON bodies
//static serve 
app.use(express.static('public'));
app.use('/froala', express.static(path.join(__dirname,'node_modules/froala-editor')));


//Routes
const writerRoutes = require('./src/routes/writer.route.js');
app.use('/writer', writerRoutes);


app.set('view engine', 'hbs'); // Set Handlebars as the view engine
app.set('views', './src/views'); // Set the views directory

// Test route for rendering the Handlebars view
app.get('/', (req, res) => {
    res.render('vwWriter/writer');
});



// // Route to handle saving the content from the Froala editor
// app.post('/save', (req, res) => {
//   const editorContent = req.body.editorContent;
//   console.log("Content saved: ", editorContent);
//   // You can save the content to a database or a file here.
//   res.send('Content saved successfully!');
// });

// Start the server (for testing purposes)
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


