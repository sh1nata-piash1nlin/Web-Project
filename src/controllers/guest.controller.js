<<<<<<< HEAD
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
=======
// controllers/guest.controller.js
const db = require('../config/database');

async function getCategories() {
    try {
        // Truy vấn tất cả danh mục cha (có parent_id là NULL)
        const [categories] = await db.execute(`
            SELECT id, name, parent_id 
            FROM Categories 
            WHERE parent_id IS NULL
        `);

        // Duyệt qua các danh mục cha và lấy các danh mục con
        for (let category of categories) {
            const [subcategories] = await db.execute(`
                SELECT id, name, parent_id 
                FROM Categories 
                WHERE parent_id = ?
            `, [category.id]);

            category.subcategories = subcategories;  // Thêm danh mục con vào danh mục cha
        }

        return categories;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to retrieve categories');
    }
}

async function renderHomepage(req, res) {
    try {
        const categories = await getCategories();
        res.render('home', { categories });  // Truyền dữ liệu vào view
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderHomepage
>>>>>>> hao_main
};