const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'duong',
    database: 'mysql_webnews_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Kiểm tra kết nối
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful!');
        connection.release();
    } catch (err) {
        console.error('Database connection error:', err.message);
        // Thử kết nối lại sau 5 giây
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