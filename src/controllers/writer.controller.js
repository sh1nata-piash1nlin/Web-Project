const pool = require('../config/database.js');

// Function to get categories for the writer form
async function getCategories() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [categories] = await connection.execute('SELECT id, name FROM categories');
        return categories;
    } catch (err) {
        console.error('Error fetching categories:', err);
        throw err;
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
}

// Function to save a new article to the database
async function saveArticle(articleData) {
    let connection;
    try {
        connection = await pool.getConnection();

        // SQL query to save the article
        const query = `
            INSERT INTO articles (title, abstract, content, category_id, author_id, status, featured_image, is_premium)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Prepare values
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

        const [results] = await connection.execute(query, values);
        return results;
    } catch (err) {
        console.error('Error saving article:', err);
        throw err;
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
}

// Function to get all articles for the view page
async function getArticles() {
    let connection;
    try {
        connection = await pool.getConnection();

        // SQL query to retrieve articles with category names
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

        const [articles] = await connection.execute(query);

        // Truncate content if it's too long
        const maxLength = 300;
        articles.forEach(article => {
            if (article.content.length > maxLength) {
                article.content = article.content.substring(0, maxLength) + '...';  // Truncate and add ellipsis
            }
        });

        return articles;
    } catch (err) {
        console.error('Error retrieving articles:', err);
        throw err;
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
}

// Function to get article details by ID
async function getArticleById(articleId) {
    let connection;
    try {
        connection = await pool.getConnection();

        // SQL query to retrieve article details along with category and author info
        const articleQuery = `
            SELECT 
                articles.id, 
                articles.title, 
                articles.abstract, 
                articles.content, 
                articles.status, 
                articles.is_premium, 
                articles.author_id, 
                DATE_FORMAT(articles.created_at, '%Y-%m-%d %H:%i:%s') AS publish_date,
                categories.name AS category_name,
                users.name AS author_name,
                articles.featured_image
            FROM articles
            JOIN categories ON articles.category_id = categories.id
            JOIN users ON articles.author_id = users.id
            WHERE articles.id = ?
        `;
        const [articles] = await connection.execute(articleQuery, [articleId]);

        if (articles.length === 0) {
            return null; // No article found
        }

        const article = articles[0];

        // SQL query to fetch comments for the article
        const commentsQuery = `
            SELECT 
                comments.user_name, 
                comments.comment_text, 
                DATE_FORMAT(comments.created_at, '%Y-%m-%d %H:%i:%s') AS comment_date
            FROM comments
            WHERE comments.article_id = ?
        `;
        const [comments] = await connection.execute(commentsQuery, [articleId]);

        return { article, comments };
    } catch (err) {
        console.error('Error retrieving article by ID:', err);
        throw err;
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
}

module.exports = {
    getCategories,
    saveArticle,
    getArticles,
    getArticleById
};