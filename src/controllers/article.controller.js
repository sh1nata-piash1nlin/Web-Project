// controllers/article.controller.js
const db = require('../config/database');

async function getFeaturedArticles() {
    try {
        const [featuredArticles] = await db.execute(`
           SELECT 
        a.id, 
        a.title, 
        a.abstract, 
        a.featured_image, 
        a.publish_date, 
        c.name AS category_name,
        u.full_name AS author_name
    FROM 
        Articles a
    JOIN 
        Categories c ON a.category_id = c.id
    JOIN 
        Users u ON a.author_id = u.id
    WHERE 
        a.status = 'published' 
        AND a.featured = 1
    ORDER BY 
        a.publish_date DESC
    LIMIT 5
        `);
        return featuredArticles;
    } catch (error) {
        console.error('Error fetching featured articles:', error);
        throw new Error('Failed to retrieve featured articles');
    }
}

async function getLatestArticles() {
    try {
        const [latestArticles] = await db.execute(`
            SELECT 
                id, 
                title, 
                abstract, 
                featured_image, 
                publish_date
            FROM 
                Articles
            WHERE 
                status = 'published'
            ORDER BY 
                publish_date DESC
            LIMIT 10
        `);
        return latestArticles;
    } catch (error) {
        console.error('Error fetching latest articles:', error);
        throw new Error('Failed to retrieve latest articles');
    }
}

async function getArticlesByCategory(categoryId) {
    try {
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                a.publish_date,
                c.name AS category_name
            FROM 
                Articles a
            JOIN 
                Categories c ON a.category_id = c.id
            WHERE 
                a.category_id = ? 
                AND a.status = 'published'
            ORDER BY 
                a.publish_date DESC
            LIMIT 10
        `, [categoryId]);
        return articles;
    } catch (error) {
        console.error('Error fetching articles by category:', error);
        throw new Error('Failed to retrieve articles by category');
    }
}

module.exports = {
    getFeaturedArticles,
    getLatestArticles,
    getArticlesByCategory
};