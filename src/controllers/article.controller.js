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

async function getFeaturedArticles(page = 1) {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM Articles
            WHERE status = 'published' 
            AND featured = 1
        `);

        // Get paginated articles
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date, 
                c.name AS category_name,
                u.full_name AS author_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.featured = 1
            AND a.is_premium = 0
            ORDER BY a.publish_date DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const totalArticles = countResult[0].total;
        const totalPages = Math.ceil(totalArticles / limit);

        return {
            articles,
            pagination: {
                pages: Array.from({ length: totalPages }, (_, i) => ({
                    pageNumber: i + 1,
                    isCurrentPage: i + 1 === page
                })),
                currentPage: page,
                hasPrevPage: page > 1,
                hasNextPage: page < totalPages,
                prevPage: page - 1,
                nextPage: page + 1,
                totalPages
            }
        };
    } catch (error) {
        console.error('Error fetching featured articles:', error);
        throw new Error('Failed to retrieve featured articles');
    }
}

async function getSidebarFeaturedArticles(isSubscriber = false) {
    try {
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.featured_image,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
                c.name AS category_name,
                a.is_premium
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            WHERE a.status = 'published' 
            AND a.featured = 1
            ${isSubscriber ? '' : 'AND a.is_premium = 0'}
            ORDER BY a.publish_date DESC
            LIMIT 5
        `);
        return articles;
    } catch (error) {
        console.error('Error fetching sidebar featured articles:', error);
        throw new Error('Failed to retrieve sidebar featured articles');
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


async function getArticleDetail(req, res) {
    try {
        const articleId = req.params.id;
        const isSubscriber = req.session.authUser?.role === 'subscriber';
        
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

        // Lấy comments của bài viết kèm thông tin người dùng
        const [comments] = await db.execute(`
            SELECT 
                c.id,
                c.comment_text,
                DATE_FORMAT(c.comment_date, '%d/%m/%Y %H:%i') as comment_date,
                u.full_name AS user_name,
                u.username,
                u.role
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
        
        // Sử dụng hàm mới cho sidebar
        const featuredArticles = await getSidebarFeaturedArticles(isSubscriber);
        const latestArticles = await getLatestArticles(isSubscriber);
        const mostViewedArticles = await getMostViewedArticles(isSubscriber);
        const healthArticles = await getHealthArticles(isSubscriber);
        const lifeArticles = await getLifeArticles(isSubscriber);
        const techArticles = await getTechArticles(isSubscriber);
        const carArticles = await getCarArticles(isSubscriber);

        res.render('article-detail', {
            layout: 'main',
            article,
            comments,
            relatedArticles,
            categories,
            featuredArticles,
            healthArticles,
            lifeArticles,
            carArticles,
            techArticles,
            latestArticles,
            mostViewedArticles,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0
            },
            currentUrl: req.originalUrl,
            authUser: req.session.authUser
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
        const isSubscriber = req.session.authUser?.role === 'subscriber';

        // Lấy tổng số bài viết
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM Articles a
            WHERE a.category_id = ?
            AND a.status = 'published'
            ${!isSubscriber ? 'AND a.is_premium = 0' : ''}
        `, [categoryId]);

        const totalArticles = countResult[0].total;
        const totalPages = Math.ceil(totalArticles / limit);

        // Lấy danh sách bài viết có phân trang
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
            ${!isSubscriber ? 'AND a.is_premium = 0' : ''}
            ORDER BY a.publish_date DESC
            LIMIT ? OFFSET ?
        `, [categoryId, limit, offset]);

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

        // Tạo đối tượng phân trang
        const pagination = {
            pages: Array.from({ length: totalPages }, (_, i) => ({
                pageNumber: i + 1,
                isCurrentPage: i + 1 === page
            })),
            currentPage: page,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            totalPages
        };

        // Lấy các dữ liệu khác và thêm isSubscriber
        const categories_menu = await getCategories();
        const mostViewedArticles = await getMostViewedArticles(isSubscriber);
        const featuredArticles = await getSidebarFeaturedArticles(isSubscriber);
        const latestArticles = await getLatestArticles(isSubscriber);
        const healthArticles = await getHealthArticles(isSubscriber);
        const lifeArticles = await getLifeArticles(isSubscriber);
        const techArticles = await getTechArticles(isSubscriber);
        const carArticles = await getCarArticles(isSubscriber);

        res.render('category-articles', {
            layout: 'main',
            category,
            parentCategory,
            articles,
            pagination,
            mostViewedArticles,
            featuredArticles,
            latestArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
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



async function getMostViewedArticles(isSubscriber = false) {
    try {
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.view_count,
                a.is_premium
            FROM Articles a
            WHERE a.status = 'published'
            ${isSubscriber ? '' : 'AND a.is_premium = 0'}
            ORDER BY a.view_count DESC
            LIMIT 4
        `);
        return articles;
    } catch (error) {
        console.error('Error in getMostViewedArticles:', error);
        throw error;
    }
}

async function renderHomepage(req, res) {
    try {
        const isSubscriber = req.session.authUser?.role === 'subscriber';
        const categories = await getCategories();
        const featuredArticles = await getSidebarFeaturedArticles(isSubscriber);
        const healthArticles = await getHealthArticles(isSubscriber);
        const lifeArticles = await getLifeArticles(isSubscriber);
        const techArticles = await getTechArticles(isSubscriber);
        const carArticles = await getCarArticles(isSubscriber);
        const mostViewedArticles = await getMostViewedArticles(isSubscriber);

        res.render('home', {
            layout: 'main',
            categories,
            featuredArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            mostViewedArticles,
            isSubscriber,
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

async function searchArticles(req, res) {
    try {
        const searchTerm = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const isSubscriber = req.session.authUser?.role === 'subscriber';

        // Đếm tổng số kết quả
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM Articles a
            WHERE MATCH(title, abstract, content) AGAINST(? IN NATURAL LANGUAGE MODE)
            AND status = 'published'
            ${!isSubscriber ? 'AND a.is_premium = 0' : ''}
        `, [searchTerm]);

        const totalArticles = countResult[0].total;
        const totalPages = Math.ceil(totalArticles / limit);

        // Lấy kết quả tìm kiếm có phân trang
        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.featured_image,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
                c.name as category_name,
                c.id as category_id,
                u.full_name as author_name,
                MATCH(title, abstract, content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE MATCH(title, abstract, content) AGAINST(? IN NATURAL LANGUAGE MODE)
            AND status = 'published'
            ${!isSubscriber ? 'AND a.is_premium = 0' : ''}
            ORDER BY relevance DESC
            LIMIT ? OFFSET ?
        `, [searchTerm, searchTerm, limit, offset]);

        // Tạo đối tượng phân trang
        const pagination = {
            pages: Array.from({ length: totalPages }, (_, i) => ({
                pageNumber: i + 1,
                isCurrentPage: i + 1 === page
            })),
            currentPage: page,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page - 1,
            nextPage: page + 1,
            totalPages
        };

        // Lấy dữ liệu cho sidebar và menu
        const categories = await getCategories();
        const mostViewedArticles = await getMostViewedArticles(isSubscriber);
        const featuredArticles = await getSidebarFeaturedArticles(isSubscriber);
        const latestArticles = await getLatestArticles(isSubscriber);
        const healthArticles = await getHealthArticles(isSubscriber);
        const lifeArticles = await getLifeArticles(isSubscriber);
        const techArticles = await getTechArticles(isSubscriber);
        const carArticles = await getCarArticles(isSubscriber);

        res.render('search-results', {
            layout: 'main',
            searchTerm,
            articles,
            pagination,
            categories,
            mostViewedArticles,
            featuredArticles,
            latestArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            debug: {
                totalResults: totalArticles,
                currentPage: page,
                resultsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error in searchArticles:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tìm kiếm'
        });
    }
}

async function getHealthArticles(isSubscriber = false) {
    try {
        const healthCategoryId = 8;
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date, 
                c.name AS category_name,
                u.full_name AS author_name,
                a.is_premium
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.category_id = ?
            ${isSubscriber ? '' : 'AND a.is_premium = 0'}
            ORDER BY a.publish_date DESC
            LIMIT 5
        `, [healthCategoryId]);
        
        return articles;
    } catch (error) {
        console.error('Error fetching health articles:', error);
        throw new Error('Failed to retrieve health articles');
    }
}

async function getLifeArticles(isSubscriber = false) {
    try {
        const lifeCategoryId = 9;
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date, 
                c.name AS category_name,
                u.full_name AS author_name,
                a.is_premium
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.category_id = ?
            ${isSubscriber ? '' : 'AND a.is_premium = 0'}
            ORDER BY a.publish_date DESC
            LIMIT 5
        `, [lifeCategoryId]);
        
        return articles;
    } catch (error) {
        console.error('Error fetching life articles:', error);
        throw new Error('Failed to retrieve life articles');
    }
}

async function getTechArticles(isSubscriber = false) {
    try {
        const techCategoryId = 11;
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date, 
                c.name AS category_name,
                u.full_name AS author_name,
                a.is_premium
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.category_id = ?
            ${isSubscriber ? '' : 'AND a.is_premium = 0'}
            ORDER BY a.publish_date DESC
            LIMIT 5
        `, [techCategoryId]);
        
        return articles;
    } catch (error) {
        console.error('Error fetching tech articles:', error);
        throw new Error('Failed to retrieve tech articles');
    }
}

async function getCarArticles(isSubscriber = false) {
    try {
        const carCategoryId = 12;
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image, 
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date, 
                c.name AS category_name,
                u.full_name AS author_name,
                a.is_premium
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.category_id = ?
            ${isSubscriber ? '' : 'AND a.is_premium = 0'}
            ORDER BY a.publish_date DESC
            LIMIT 5
        `, [carCategoryId]);
        
        return articles;
    } catch (error) {
        console.error('Error fetching car articles:', error);
        throw new Error('Failed to retrieve car articles');
    }
}

async function addComment(req, res) {
    try {
        // Kiểm tra user đã đăng nhập chưa
        if (!req.session.authUser) {
            return res.status(401).json({ 
                success: false, 
                message: 'Bạn cần đăng nhập để bình luận' 
            });
        }

        const { article_id, comment_text, returnUrl } = req.body;
        const user_id = req.session.authUser.id;

        // Validate input
        if (!article_id || !comment_text || comment_text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Nội dung bình luận không được để trống'
            });
        }

        // Thêm comment vào database
        await db.execute(`
            INSERT INTO Comments (article_id, user_id, comment_text, comment_date)
            VALUES (?, ?, ?, NOW())
        `, [article_id, user_id, comment_text]);

        // Redirect về trang trước đó
        if (returnUrl) {
            res.redirect(returnUrl);
        } else {
            // Fallback nếu không có returnUrl
            const isSubscriber = req.session.authUser?.role === 'subscriber';
            const baseUrl = isSubscriber ? '/subscriber/article/' : '/article/';
            res.redirect(baseUrl + article_id);
        }

    } catch (error) {
        console.error('Error in addComment:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi thêm bình luận'
        });
    }
}

module.exports = {
    getFeaturedArticles,
    getSidebarFeaturedArticles,
    getLatestArticles,
    getCategoryArticles,
    getArticleDetail,
    getCategories,
    renderHomepage,
    getMostViewedArticles,
    searchArticles,
    getHealthArticles,
    getLifeArticles,
    getTechArticles,
    getCarArticles,
    getAllArticles,
    addComment
};