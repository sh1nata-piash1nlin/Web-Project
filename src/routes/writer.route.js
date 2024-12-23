const express = require('express');
const pool = require('../config/database.js'); // MySQL2 for database connection

const router = express.Router();

router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        // Query to get category names and IDs
        const [categories] = await connection.execute('SELECT id, name FROM categories');

        // Render the form with categories
        res.render('vwWriter/writer', { 
            layout : 'writer-editor.hbs',
            categories 
            });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Error fetching categories');
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});


// Route to handle saving the content from the Froala editor
router.post('/save', async (req, res) => {

    // Destructure and validate data from the request body
    const { title, abstract, editorContent, category_id, author_id, premium, status, featured_image } = req.body;

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
        category_id: category_id || null,  // Ensure category_id is not undefined
        author_id: author_id || 1,  // Use the provided author_id or default to 1
        status: status || 'draft', // Default to 'draft' if not provided
        featured_image: featured_image || null,  // Default to null if not provided
        premium: premium || false // Default to false if not provided
    };

    // Log the prepared article data for debugging
    console.log('Prepared article data:', articleData);

    // SQL query to save the article
    const query = `
        INSERT INTO articles (title, abstract, content, category_id, author_id, status, featured_image, is_premium)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        articleData.premium
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

        // Query to retrieve premium articles along with category names
        const query = `
            SELECT 
                articles.id, 
                articles.title, 
                articles.abstract, 
                articles.content, 
                articles.status, 
                articles.is_premium, 
                articles.author_id, 
                DATE_FORMAT(articles.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                categories.name AS category_name
            FROM articles
            JOIN categories ON articles.category_id = categories.id
        `;

        // Execute the query
        const [articles] = await connection.execute(query);

        // Check if articles exist
        if (articles.length === 0) {
            return res.render('vwWriter/view', { articles: [], message: "No premium articles available." });
        }

        // Truncate content to 300 characters (or another limit you prefer)
        const maxLength = 300;
        articles.forEach(article => {
            if (article.content.length > maxLength) {
                article.content = article.content.substring(0, maxLength) + '...';  // Truncate and add ellipsis
            }
        });

        // Render the view and pass the articles data to Handlebars
        res.render('vwWriter/view', {
            articles: articles,
            layout: 'writer-editor.hbs'
        });

    } catch (err) {
        console.error('Error retrieving articles:', err);
        res.status(500).json({ success: false, message: 'Error retrieving articles' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});



module.exports = router; // Make sure to export the router instance
