const db = require('../config/database');
const articleController = require('./article.controller');

async function getCategories() {
    try {
        const [categories] = await db.execute(`
            SELECT id, name, parent_id 
            FROM Categories 
            WHERE parent_id IS NULL
        `);

        for (let category of categories) {
            const [subcategories] = await db.execute(`
                SELECT id, name, parent_id 
                FROM Categories 
                WHERE parent_id = ?
            `, [category.id]);

            category.subcategories = subcategories;
        }

        return categories;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to retrieve categories');
    }
}



// Định nghĩa hàm renderHomepage
async function renderHomepage(req, res) {
    try {
        // Lấy danh mục và bài báo nổi bật
        const categories = await getCategories();
        const featuredArticles = await articleController.getFeaturedArticles();
        const mostViewedArticles = await articleController.getMostViewedArticles();

        // Render view và truyền dữ liệu cho view
        res.render('home', {
            categories,
            featuredArticles,
            mostViewedArticles,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0
            }
        });
    } catch (error) {
        console.error('Lỗi khi render homepage:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderHomepage,
};
