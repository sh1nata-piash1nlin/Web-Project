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
};