const express = require('express');
const pool = require('../config/database.js'); // MySQL2 for database connection

const router = express.Router();

// Route to handle saving the content from the Froala editor
router.post('/save', async (req, res) => {

    // Destructure and validate data from the request body
    const { title, abstract, editorContent } = req.body;

    // Log the data to check for missing fields
    console.log('Received data:', req.body);

    // Ensure required fields are present
    if (!title || !editorContent) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Set defaults for optional fields, replacing undefined with null
    const articleData = {
        title: title || null,
        abstract: abstract || null,  // Can be null if not provided
        content: editorContent || null,  // Froala content
        category_id: 1,  // Example category ID (update as needed)
        author_id: 1,    // Example author ID (update as needed)
        status: 'draft', // Default status
        featured_image: null, // Example image URL, update as needed
    };

    // Log the prepared article data for debugging
    console.log('Prepared article data:', articleData);

    // SQL query to save the article
    const query = `
        INSERT INTO articles (title, abstract, content, category_id, author_id, status, featured_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Prepare the values to be inserted into the query
    const values = [
        articleData.title,
        articleData.abstract,
        articleData.content,
        articleData.category_id,
        articleData.author_id,
        articleData.status,
        articleData.featured_image,
    ];

    // Ensure that there are no undefined values (replace them with null)
    const sanitizedValues = values.map(value => (value === undefined ? null : value));

    // Get a connection from the pool
    let connection;
    try {
        connection = await pool.getConnection();

        // Execute the query with the sanitized values
        const [results] = await connection.execute(query, sanitizedValues);

        // Respond with success
        res.json({ success: true, message: 'Article saved successfully', data: results });

    } catch (err) {
        console.error('Error saving article:', err);
        res.status(500).json({ success: false, message: 'Error saving article' });

    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

router.get('/view', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Query to retrieve articles from the database
        const [articles] = await connection.execute('SELECT * FROM articles');

        // Render the view and pass the articles data to Handlebars
        res.render('vwWriter/view', { articles: articles });

    } catch (err) {
        console.error('Error retrieving articles:', err);
        res.status(500).json({ success: false, message: 'Error retrieving articles' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

module.exports = router; // Make sure to export the router instance
