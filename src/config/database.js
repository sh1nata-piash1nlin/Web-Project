const mysql = require('mysql2/promise'); // Sử dụng mysql2 với Promise

// Cấu hình kết nối database
const pool = mysql.createPool({
    host: 'localhost',       // Tên host của database (thường là 'localhost')
    user: 'root',            // Tên người dùng MySQL
    password: '', // Mật khẩu của bạn
    database: 'sql_webnews_db',  // Tên database
    waitForConnections: true, // Chờ nếu không có kết nối nào có sẵn
    connectionLimit: 10,      // Số kết nối tối đa trong pool
    queueLimit: 0             // Không giới hạn số lượng query trong hàng đợi
});

// Kiểm tra kết nối (tuỳ chọn)
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Kết nối database thành công!');
        connection.release(); // Giải phóng kết nối sau khi kiểm tra
    } catch (err) {
        console.error('Lỗi kết nối database:', err.message);
    }
})();

module.exports = pool;