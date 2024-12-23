const db = require('../config/database');
const articleController = require('./article.controller');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function getFeaturedArticlesPremium(page = 1) {
    try {
        const limit = 5;
        const offset = (page - 1) * limit;

        // Get total count for pagination
        const [totalRows] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM Articles a 
            WHERE a.status = 'published' AND a.featured = 1
        `);

        const totalArticles = totalRows[0].count;
        const totalPages = Math.ceil(totalArticles / limit);

        // Get articles with pagination
        const [articles] = await db.execute(`
            SELECT 
                a.id, 
                a.title, 
                a.abstract, 
                a.featured_image,
                a.is_premium, 
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date, 
                c.name AS category_name,
                u.full_name AS author_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.status = 'published' 
            AND a.featured = 1
            ORDER BY a.is_premium DESC, a.publish_date DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        articles.forEach(article => {
            article.isPremiumBadge = article.is_premium ? 'Premium' : '';
        });

        // Create pagination object
        const pagination = {
            pages: [],
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages
        };

        // Generate page numbers
        for (let i = 1; i <= totalPages; i++) {
            pagination.pages.push({
                pageNumber: i,
                isCurrentPage: i === page
            });
        }

        return {
            articles,
            pagination
        };
    } catch (error) {
        console.error('Error fetching premium featured articles:', error);
        throw new Error('Failed to retrieve premium featured articles');
    }
}

async function getCategoryArticlesPremium(req, res) {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;

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

        // Lấy tổng số bài viết để phân trang
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM Articles a
            WHERE a.category_id = ?
            AND a.status = 'published'
        `, [categoryId]);

        const totalArticles = countResult[0].total;
        const totalPages = Math.ceil(totalArticles / limit);

        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.featured_image,
                a.is_premium,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
                u.full_name as author_name,
                a.view_count
            FROM Articles a
            JOIN Users u ON a.author_id = u.id
            WHERE a.category_id = ?
            AND a.status = 'published'
            ORDER BY a.is_premium DESC, a.publish_date DESC
            LIMIT ? OFFSET ?
        `, [categoryId, limit, offset]);

        articles.forEach(article => {
            article.isPremiumBadge = article.is_premium ? 'Premium' : '';
        });

        // Tạo đối tượng phân trang theo cấu trúc template hiện tại
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

        // Get other required data using existing article controller functions
        const categories_menu = await articleController.getCategories();
        const mostViewedArticles = await articleController.getMostViewedArticles(true);
        const featuredArticles = await articleController.getSidebarFeaturedArticles(true);
        const latestArticles = await articleController.getLatestArticles(true);
        const healthArticles = await articleController.getHealthArticles(true);
        const lifeArticles = await articleController.getLifeArticles(true);
        const techArticles = await articleController.getTechArticles(true);
        const carArticles = await articleController.getCarArticles(true);

        res.render('category-articles', {
            layout: 'main',
            category,
            articles,
            categories: categories_menu,
            mostViewedArticles,
            featuredArticles,
            latestArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            pagination,
            isSubscriber: true,
            debug: {
                hasMostViewed: mostViewedArticles && mostViewedArticles.length > 0,
                totalArticles: totalArticles,
                currentPage: page,
                articlesPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error in getCategoryArticlesPremium:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tải danh mục'
        });
    }
}

async function searchArticlesPremium(req, res) {
    try {
        const searchTerm = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;

        // Đếm tổng số kết quả để phân trang
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM Articles a
            WHERE MATCH(title, abstract, content) AGAINST(? IN NATURAL LANGUAGE MODE)
            AND status = 'published'
        `, [searchTerm]);

        const totalArticles = countResult[0].total;
        const totalPages = Math.ceil(totalArticles / limit);

        const [articles] = await db.execute(`
            SELECT 
                a.id,
                a.title,
                a.abstract,
                a.featured_image,
                a.is_premium,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date,
                c.name as category_name,
                u.full_name as author_name,
                MATCH(title, abstract, content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE MATCH(title, abstract, content) AGAINST(? IN NATURAL LANGUAGE MODE)
            AND status = 'published'
            ORDER BY a.is_premium DESC, relevance DESC
            LIMIT ? OFFSET ?
        `, [searchTerm, searchTerm, limit, offset]);

        articles.forEach(article => {
            article.isPremiumBadge = article.is_premium ? 'Premium' : '';
        });

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

        // Get other required data
        const categories = await articleController.getCategories();
        const mostViewedArticles = await articleController.getMostViewedArticles(true);
        const featuredArticles = await articleController.getSidebarFeaturedArticles(true);
        const latestArticles = await articleController.getLatestArticles(true);
        const healthArticles = await articleController.getHealthArticles(true);
        const lifeArticles = await articleController.getLifeArticles(true);
        const techArticles = await articleController.getTechArticles(true);
        const carArticles = await articleController.getCarArticles(true);

        res.render('search-results', {
            layout: 'main',
            searchTerm,
            articles,
            categories,
            mostViewedArticles,
            featuredArticles,
            latestArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            pagination,
            isSubscriber: true,
            debug: {
                totalResults: totalArticles,
                currentPage: page,
                resultsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error in searchArticlesPremium:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tìm kiếm'
        });
    }
}

async function renderSubscriberHomepage(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const { articles: featuredArticles, pagination } = await getFeaturedArticlesPremium(page);
        const categories = await articleController.getCategories();
        const mostViewedArticles = await articleController.getMostViewedArticles();
        const latestArticles = await articleController.getLatestArticles();
        const healthArticles = await articleController.getHealthArticles();
        const lifeArticles = await articleController.getLifeArticles();
        const techArticles = await articleController.getTechArticles();
        const carArticles = await articleController.getCarArticles();

        // Lấy thời gian premium còn lại
        let premiumTimeLeft = null;
        if (req.session.authUser && req.session.authUser.role === 'subscriber') {
            premiumTimeLeft = await getRemainingPremiumTime(req.session.authUser.id);
        }

        res.render('home', {
            layout: 'main',
            categories,
            featuredArticles,
            mostViewedArticles,
            latestArticles,
            healthArticles,
            pagination,
            lifeArticles,
            techArticles,
            carArticles,
            isSubscriber: true,
            premiumTimeLeft
        });
    } catch (error) {
        console.error('Error in renderSubscriberHomepage:', error);
        res.status(500).render('error', {
            layout: 'main',
            message: 'Có lỗi xảy ra khi tải trang chủ'
        });
    }
}

async function getArticleDetailPremium(req, res) {
    try {
        const articleId = req.params.id;
        
        // Tăng lượt xem
        await db.execute(`
            UPDATE Articles 
            SET view_count = COALESCE(view_count, 0) + 1 
            WHERE id = ?
        `, [articleId]);

        // Lấy thông tin bài viết
        const [articles] = await db.execute(`
            SELECT a.*, 
                   c.name as category_name,
                   u.full_name as author_name
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.id = ?
            ORDER BY a.is_premium DESC
        `, [articleId]);

        if (articles.length === 0) {
            return res.status(404).render('404', { layout: 'main' });
        }

        // Lấy comments của bài viết
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

        const categories = await articleController.getCategories();
        const mostViewedArticles = await articleController.getMostViewedArticles(true);
        const featuredArticles = await articleController.getSidebarFeaturedArticles(true);
        const latestArticles = await articleController.getLatestArticles(true);
        const healthArticles = await articleController.getHealthArticles(true);
        const lifeArticles = await articleController.getLifeArticles(true);
        const techArticles = await articleController.getTechArticles(true);
        const carArticles = await articleController.getCarArticles(true);

        res.render('article-detail', {
            layout: 'main',
            article: articles[0],
            comments,
            categories,
            mostViewedArticles,
            featuredArticles,
            latestArticles,
            healthArticles,
            lifeArticles,
            techArticles,
            carArticles,
            isSubscriber: true,
            currentUrl: req.originalUrl,
            authUser: req.session.authUser
        });
    } catch (error) {
        console.error('Error in getArticleDetailPremium:', error);
        res.status(500).render('error', { 
            layout: 'main',
            message: 'Có lỗi xảy ra khi tải bài viết' 
        });
    }
}

async function downloadArticlePDF(req, res) {
    try {
        const articleId = req.params.id;
        const [article] = await db.execute(`
            SELECT 
                a.*,
                c.name as category_name,
                u.full_name as author_name,
                DATE_FORMAT(a.publish_date, '%d/%m/%Y') as publish_date
            FROM Articles a
            JOIN Categories c ON a.category_id = c.id
            JOIN Users u ON a.author_id = u.id
            WHERE a.id = ? AND a.status = 'published'
        `, [articleId]);

        if (article.length === 0) {
            return res.status(404).send('Article not found');
        }

        // Create PDF document
        const doc = new PDFDocument();
        const filename = `article-${articleId}.pdf`;

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content to PDF
        doc
            .fontSize(24)
            .font('Helvetica-Bold')
            .text(article[0].title, { align: 'center' })
            .moveDown();

        doc
            .fontSize(12)
            .font('Helvetica')
            .text(`Chuyên mục: ${article[0].category_name}`, { align: 'left' })
            .text(`Tác giả: ${article[0].author_name}`, { align: 'left' })
            .text(`Ngày đăng: ${article[0].publish_date}`, { align: 'left' })
            .moveDown();

        if (article[0].abstract) {
            doc
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Tóm tắt:', { align: 'left' })
                .moveDown(0.5)
                .fontSize(12)
                .font('Helvetica')
                .text(article[0].abstract, { align: 'justify' })
                .moveDown();
        }

        // Add main content
        doc
            .fontSize(12)
            .font('Helvetica')
            .text(article[0].content.replace(/<[^>]*>/g, ''), {
                align: 'justify',
                lineGap: 5
            });

        // Add footer
        doc
            .moveDown()
            .fontSize(10)
            .text('© VnExpress - Bài viết Premium', {
                align: 'center',
                color: 'grey'
            });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
}

async function getSubscriberArticleDetail(req, res) {
    return articleController.getArticleDetail(req, res);
}

async function getRemainingPremiumTime(userId) {
    try {
        const [user] = await db.execute(`
            SELECT subscription_expiry 
            FROM Users 
            WHERE id = ?
        `, [userId]);

        if (user.length === 0 || !user[0].subscription_expiry) {
            return null;
        }

        const expiryDate = new Date(user[0].subscription_expiry);
        const now = new Date();
        const timeLeft = expiryDate - now;

        // Nếu đã hết hạn
        if (timeLeft <= 0) {
            return 'Hết hạn';
        }

        // Tính toán thời gian còn lại
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        let timeString = '';
        if (days > 0) {
            timeString += `${days} ngày `;
        }
        if (hours > 0) {
            timeString += `${hours} giờ `;
        }
        timeString += `${minutes} phút`;

        return `còn ${timeString}`;
    } catch (error) {
        console.error('Error getting remaining premium time:', error);
        return null;
    }
}

module.exports = {
    renderSubscriberHomepage,
    getFeaturedArticlesPremium,
    getCategoryArticlesPremium,
    searchArticlesPremium,
    getArticleDetailPremium,
    downloadArticlePDF,
    getSubscriberArticleDetail,
    getRemainingPremiumTime
};
