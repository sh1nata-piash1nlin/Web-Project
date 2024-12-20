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
    }
};

module.exports = adminController;