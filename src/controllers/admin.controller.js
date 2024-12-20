const db = require('../config/database');
const adminController = {
    // Dashboard
    async getDashboard(req, res) {
        try {
            // Lấy thống kê cơ bản
            const [categoriesCount] = await db.execute('SELECT COUNT(*) as count FROM Categories');
            const [articlesCount] = await db.execute('SELECT COUNT(*) as count FROM Articles');
            const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM Users');
            const [tagsCount] = await db.execute('SELECT COUNT(*) as count FROM Tags');
            res.render('admin/dashboard', {
                layout: 'admin',
                stats: {
                    categories: categoriesCount[0].count,
                    articles: articlesCount[0].count,
                    users: usersCount[0].count,
                    tags: tagsCount[0].count
                }
            });
        } catch (error) {
            console.error('Error in getDashboard:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    },
    // Categories Management
    async getCategories(req, res) {
        try {
            const [categories] = await db.execute(`
               SELECT c.*, 
                      p.name as parent_name 
               FROM Categories c 
               LEFT JOIN Categories p ON c.parent_id = p.id
               ORDER BY c.name
           `);
            res.render('admin/categories', {
                layout: 'admin',
                categories
            });
        } catch (error) {
            console.error('Error in getCategories:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    },
    async addCategory(req, res) {
        try {
            const { name, parent_id } = req.body;
            await db.execute(
                'INSERT INTO Categories (name, parent_id) VALUES (?, ?)',
                [name, parent_id || null]
            );
            res.redirect('/admin/categories');
        } catch (error) {
            console.error('Error in addCategory:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    },
    // Các phương thức khác sẽ được thêm vào sau
    async getCategoryById(req, res) {
        try {
            const [category] = await db.execute(
                'SELECT * FROM Categories WHERE id = ?',
                [req.params.id]
            );
            if (category.length > 0) {
                res.json(category[0]);
            } else {
                res.status(404).json({ message: 'Category not found' });
            }
        } catch (error) {
            console.error('Error in getCategoryById:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    // Cập nhật category
    async updateCategory(req, res) {
        try {
            const { name, parent_id } = req.body;
            await db.execute(
                'UPDATE Categories SET name = ?, parent_id = ? WHERE id = ?',
                [name, parent_id || null, req.params.id]
            );
            res.json({ success: true });
        } catch (error) {
            console.error('Error in updateCategory:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    // Xóa category
    async deleteCategory(req, res) {
        try {
            await db.execute('DELETE FROM Categories WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error in deleteCategory:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    async getTags(req, res) {
        try {
            const [tags] = await db.execute('SELECT * FROM Tags ORDER BY name');
            res.render('admin/tags', {
                layout: 'admin',
                tags
            });
        } catch (error) {
            console.error('Error in getTags:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    },
    async addTag(req, res) {
        try {
            const { name } = req.body;
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.execute(
                'INSERT INTO Tags (name, created_at, updated_at) VALUES (?, ?, ?)',
                [name, now, now]
            );
            res.redirect('/admin/tags');
        } catch (error) {
            console.error('Error in addTag:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    },
    async getTagById(req, res) {
        try {
            const [tags] = await db.execute(
                'SELECT * FROM Tags WHERE id = ?',
                [req.params.id]
            );
            if (tags.length > 0) {
                res.json(tags[0]);
            } else {
                res.status(404).json({ message: 'Tag not found' });
            }
        } catch (error) {
            console.error('Error in getTagById:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    async updateTag(req, res) {
        try {
            const { name } = req.body;
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.execute(
                'UPDATE Tags SET name = ?, updated_at = ? WHERE id = ?',
                [name, now, req.params.id]
            );
            res.json({ success: true });
        } catch (error) {
            console.error('Error in updateTag:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    async deleteTag(req, res) {
        try {
            await db.execute('DELETE FROM Tags WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error in deleteTag:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    // article
    async getArticles(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            // Get total count
            const [countResult] = await db.execute('SELECT COUNT(*) as total FROM Articles');
            const total = countResult[0].total || 0;
            // Sửa lại query - dùng số trực tiếp thay vì tham số
            const [articles] = await db.execute(`
                SELECT a.*, c.name as category_name
                FROM Articles a
                LEFT JOIN Categories c ON a.category_id = c.id
                ORDER BY a.created_at DESC
                LIMIT ${offset}, ${limit}
            `);
            // Get categories and tags for filters
            const [categories] = await db.execute('SELECT * FROM Categories');
            const [tags] = await db.execute('SELECT * FROM Tags');
            // Calculate pagination
            const totalPages = Math.ceil(total / limit);
            const pagination = {
                prev: page > 1 ? page - 1 : null,
                next: page < totalPages ? page + 1 : null,
                pages: Array.from({ length: totalPages }, (_, i) => ({
                    number: i + 1,
                    active: i + 1 === page
                }))
            };
            res.render('admin/articles', {
                layout: 'admin',
                articles: articles || [],
                categories: categories || [],
                tags: tags || [],
                pagination
            });
        } catch (error) {
            console.error('Error in getArticles:', error);
            res.status(500).render('error', { message: 'Internal Server Error' });
        }
    },
    async addArticle(req, res) {
        try {
            const { title, abstract, content, category_id, status } = req.body;
            let featured_image = null;
            // Xử lý upload ảnh
            if (req.files && req.files.featured_image) {
                const file = req.files.featured_image;
                const fileName = Date.now() + '-' + file.name;
                const filePath = path.join(__dirname, '../public/uploads', fileName);

                await file.mv(filePath);
                featured_image = `/uploads/${fileName}`;
            }
            // Thêm bài viết vào database
            const [result] = await db.execute(
                `INSERT INTO Articles (
                    title,
                    abstract, 
                    content, 
                    category_id, 
                    status, 
                    featured_image,
                    author_id,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, NOW())`,
                [title, abstract, content, category_id, status, featured_image]
            );
            res.json({
                success: true,
                message: 'Article added successfully',
                articleId: result.insertId
            });
        } catch (error) {
            console.error('Error in addArticle:', error);
            res.status(500).json({
                success: false,
                message: 'Error adding article'
            });
        }
    },
    async getArticleById(req, res) {
        try {
            const [articles] = await db.execute(`
                SELECT a.*, c.name as category_name,
                       GROUP_CONCAT(t.id) as tag_ids,
                       GROUP_CONCAT(t.name) as tag_names
                FROM Articles a
                LEFT JOIN Categories c ON a.category_id = c.id
                LEFT JOIN Article_Tags at ON a.id = at.article_id
                LEFT JOIN Tags t ON at.tag_id = t.id
                WHERE a.id = ?
                GROUP BY a.id
            `, [req.params.id]);
            if (articles.length > 0) {
                const article = articles[0];
                if (article.tag_ids) {
                    article.tags = article.tag_ids.split(',').map((id, index) => ({
                        id,
                        name: article.tag_names.split(',')[index]
                    }));
                }
                res.json(article);
            } else {
                res.status(404).json({ message: 'Article not found' });
            }
        } catch (error) {
            console.error('Error in getArticleById:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    async updateArticle(req, res) {
        try {
            const { title, content, category_id, status } = req.body;
            let thumbnail = null;
            if (req.file) {
                thumbnail = `/uploads/${req.file.filename}`;
            }
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.execute(`
                UPDATE Articles 
                SET title = ?, content = ?, category_id = ?, 
                    status = ?, updated_at = ?
                    ${thumbnail ? ', thumbnail = ?' : ''}
                WHERE id = ?
            `, [
                title, content, category_id, status, now,
                ...(thumbnail ? [thumbnail] : []),
                req.params.id
            ]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error in updateArticle:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    async deleteArticle(req, res) {
        try {
            await db.execute('DELETE FROM Articles WHERE id = ?', [req.params.id]);
            res.json({ success: true });
        } catch (error) {
            console.error('Error in deleteArticle:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

module.exports = adminController;