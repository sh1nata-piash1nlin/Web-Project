

const express = require('express');
const app = express();
const path = require('path');

// Cấu hình Handlebars
const exphbs = require('express-handlebars');
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main', // Layout chính (main.hbs)
    layoutsDir: path.join(__dirname, 'views', 'layout'),
    partialsDir: path.join(__dirname, 'views', 'partial'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Import route cho guest
const guestRoutes = require('./routes/guest.routes');

// Đảm bảo bạn đã định nghĩa route cho trang chủ
app.use('/', guestRoutes);




// Cấu hình port và khởi động server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
