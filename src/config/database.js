const mysql = require('mysql2/promise');

// Cấu hình kết nối database
const pool = mysql.createPool({
    host: 'localhost',       // Tên host của database (thường là 'localhost')
    user: 'root',            // Tên người dùng MySQL
    password: '123123', // Mật khẩu của bạn
    database: 'mysql_webnews_db',  // Tên database
    waitForConnections: true, // Chờ nếu không có kết nối nào có sẵn
    connectionLimit: 10,      // Số kết nối tối đa trong pool
    queueLimit: 0             // Không giới hạn số lượng query trong hàng đợi
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful!');
        connection.release();
    } catch (err) {
        console.error('Database connection error:', err.message);
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            pool.getConnection()
                .then(conn => {
                    console.log('Reconnection successful!');
                    conn.release();
                })
                .catch(err => console.error('Reconnection failed:', err.message));
        }, 5000);
    }
})();

module.exports = pool;