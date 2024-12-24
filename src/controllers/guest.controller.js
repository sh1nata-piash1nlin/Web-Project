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
        const page = parseInt(req.query.page) || 1;
        const categories = await getCategories();
        const { articles: featuredArticles, pagination } = await articleController.getFeaturedArticles(page);
        const sidebarFeaturedArticles = await articleController.getSidebarFeaturedArticles();
        const healthArticles = await articleController.getHealthArticles();
        const lifeArticles = await articleController.getLifeArticles();
        const techArticles = await articleController.getTechArticles();
        const carArticles = await articleController.getCarArticles();
        const mostViewedArticles = await articleController.getMostViewedArticles();
        const latestArticles = await articleController.getLatestArticles();


        res.render('home', {
            layout: 'main',
            categories,
            featuredArticles,
            sidebarFeaturedArticles,
            pagination,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            mostViewedArticles,
            latestArticles,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0
            }
        });
    } catch (error) {
        console.error('Error in renderHomepage:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tải trang chủ'
        });
    }
}

module.exports = {
    renderHomepage,
};

