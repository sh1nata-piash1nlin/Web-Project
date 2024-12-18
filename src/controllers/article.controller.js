// controllers/article.controller.js
const db = require('../config/database');

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
        console.error('Error fetching categories:', error);
        throw new Error('Failed to retrieve categories');
    }
}

async function getFeaturedArticles() {
    try {
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                a.publish_date, 
                c.name AS category_name,
                u.full_name AS author_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.featured = 1
            ORDER BY a.publish_date DESC
            LIMIT 5
        `);
        return articles;
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
        console.log('Fetching articles for category:', categoryId);
        
        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.featured_image,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
                c.name as category_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            WHERE a.category_id = ?
            AND a.status = 'published'
            ORDER BY a.publish_date DESC
            LIMIT 5
        `, [categoryId]);
        
        console.log('Found articles:', articles);
        return articles;
    } catch (error) {
        console.error('Error fetching articles by category:', error);
        throw error;
    }
}

async function getArticleDetail(req, res) {
    try {
        const articleId = req.params.id;
        
        // Tăng lượt xem
        await db.execute(`
            UPDATE Articles 
            SET view_count = COALESCE(view_count, 0) + 1 
            WHERE id = ?
        `, [articleId]);

        // Lấy thông tin chi tiết bài viết
        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.content,
                a.featured_image,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y %H:%i') as publish_date,
                c.name AS category_name,
                u.full_name AS author_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.id = ? AND a.status = 'published'
        `, [articleId]);

        if (articles.length === 0) {
            return res.status(404).render('404', { 
                layout: 'main',
                message: 'Bài viết không tồn tại' 
            });
        }

        const article = articles[0];

        // Lấy comments của bài viết
        const [comments] = await db.execute(`
            SELECT 
                c.id,
                c.comment_text,
                DATE_FORMAT(c.comment_date, '%d/%m/%Y %H:%i') as comment_date,
                u.full_name AS user_name
            FROM Comments c
            JOIN Users u ON c.user_id = u.id
            WHERE c.article_id = ?
            ORDER BY c.comment_date DESC
        `, [articleId]);

        // Lấy các bài viết liên quan (cùng category)
        const [relatedArticles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.featured_image,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date
            FROM Articles a
            WHERE a.category_id = (
                SELECT category_id FROM Articles WHERE id = ?
            )
            AND a.id != ?
            AND a.status = 'published'
            LIMIT 3
        `, [articleId, articleId]);

        // Lấy danh mục để hiển thị menu
        const categories = await getCategories();
        
        // Thêm các bài viết cho sidebar
        const featuredArticles = await getFeaturedArticles();
        const latestArticles = await getLatestArticles();
        const mostViewedArticles = await getMostViewedArticles();

        res.render('article-detail', {
            layout: 'main',
            article,
            comments,
            relatedArticles,
            categories,
            featuredArticles,
            latestArticles,
            mostViewedArticles,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0
            }
        });

    } catch (error) {
        console.error('Error in getArticleDetail:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tải bài viết'
        });
    }
}

async function getCategoryArticles(req, res) {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Lấy tổng số bài viết
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM Articles a
            WHERE a.category_id = ?
            AND a.status = 'published'
        `, [categoryId]);

        // Lấy danh sách bài viết - Đơn giản hóa câu query
        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.featured_image,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
                u.full_name as author_name,
                a.view_count
            FROM Articles a
            JOIN Users u ON a.author_id = u.id
            WHERE a.category_id = ?
            AND a.status = 'published'
            ORDER BY a.publish_date DESC
            LIMIT ? OFFSET ?
        `, [categoryId, limit, offset]);

        console.log('Total articles:', countResult[0].total);
        console.log('Current page articles:', articles.length);
        console.log('Page:', page);
        console.log('Limit:', limit);
        console.log('Offset:', offset);

        const totalArticles = countResult[0].total;
        const totalPages = Math.ceil(totalArticles / limit);

        // Lấy thông tin category hiện tại
        const [categories] = await db.execute(`
            SELECT id, name, parent_id
            FROM Categories
            WHERE id = ?
        `, [categoryId]);

        if (categories.length === 0) {
            return res.status(404).render('404', {
                layout: 'main',
                message: 'Không tìm thấy danh mục'
            });
        }

        const category = categories[0];

        // Lấy thông tin category cha nếu có
        let parentCategory = null;
        if (category.parent_id) {
            const [parents] = await db.execute(`
                SELECT id, name
                FROM Categories
                WHERE id = ?
            `, [category.parent_id]);
            if (parents.length > 0) {
                parentCategory = parents[0];
            }
        }

        // Tạo object phân trang
        const pagination = {
            pages: [],
            currentPage: page,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            totalPages: totalPages
        };

        // Tạo mảng các trang
        for (let i = 1; i <= totalPages; i++) {
            pagination.pages.push({
                pageNumber: i,
                isCurrentPage: i === page
            });
        }

        // Lấy các dữ liệu khác
        const categories_menu = await getCategories();
        const mostViewedArticles = await getMostViewedArticles();
        const featuredArticles = await getFeaturedArticles();
        const latestArticles = await getLatestArticles();

        res.render('category-articles', {
            layout: 'main',
            category,
            parentCategory,
            articles,
            pagination,
            mostViewedArticles,
            featuredArticles,
            latestArticles,
            categories: categories_menu,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0,
                totalArticles: totalArticles,
                currentPage: page,
                articlesPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error in getCategoryArticles:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tải danh mục'
        });
    }
}
async function getAllArticles() {
    try {
        const [articles] = await db.execute(`
            SELECT 
                a.*,
                c.id as category_id,
                c.name as category_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            WHERE a.status = 'published'
            ORDER BY a.publish_date DESC
        `);
        return articles;
    } catch (error) {
        console.error('Error fetching all articles:', error);
        throw new Error('Failed to retrieve articles');
    }
}



async function getMostViewedArticles() {
    try {
        console.log('Starting getMostViewedArticles...');
        
        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.view_count
            FROM articles a
            WHERE a.status = 'published'
            ORDER BY a.view_count DESC
            LIMIT 4
        `);
        
        console.log('Query executed successfully');
        console.log('Most viewed articles found:', articles);
        
        return articles;
    } catch (error) {
        console.error('Error in getMostViewedArticles:', error);
        throw error;
    }
}

async function renderHomepage(req, res) {
    try {
        const categories = await getCategories();
        const featuredArticles = await getFeaturedArticles();
        const healthArticles = await getArticlesByCategory(8);
        const lifeArticles = await getArticlesByCategory(9);
        const techArticles = await getArticlesByCategory(11);
        const carArticles = await getArticlesByCategory(12);
        const mostViewedArticles = await getMostViewedArticles();

        res.render('home', {
            layout: 'main',
            categories,
            featuredArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            mostViewedArticles,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0
            }
        });
    } catch (error) {
        console.error('Error in renderHomepage:', error);
        res.status(500).render('error', { message: 'Có lỗi xảy ra khi tải trang chủ' });
    }
}

module.exports = {
    getFeaturedArticles,
    getLatestArticles,
    getArticlesByCategory,
    getArticleDetail,
    getCategories,
    getCategoryArticles,
    renderHomepage,
    getMostViewedArticles
};