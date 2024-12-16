const db = require('../utils/db.js')

module.exports = {
    add(entity) {
        return db('users').insert(entity);
    },

    findByUsername(email) {
        return db('users').where('email', email).first();
    },
};
