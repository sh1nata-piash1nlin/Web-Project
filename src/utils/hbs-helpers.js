const exphbs = require('express-handlebars');
// Tạo instance của handlebars
const hbs = exphbs.create({
    helpers: {
        truncate: function (str, len) {
            if (str && str.length > len) {
                return str.substring(0, len) + '...';
            }
            return str;
        },

        formatDate: function (date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('vi-VN');
        },

        statusColor: function (status) {
            switch (status) {
                case 'published':
                    return 'success';
                case 'draft':
                    return 'warning';
                case 'archived':
                    return 'secondary';
                default:
                    return 'primary';
            }
        }
    }
});
module.exports = hbs;