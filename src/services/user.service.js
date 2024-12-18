const db = require('../utils/db.js');

module.exports = {
    add(entity) {
        return db('users').insert(entity);
    },

    findByUsername(email) {
        return db('users').where('email', email).first();
    },

    updateUser(id, updates) {
        return db('users').where('id', id).update(updates);
    }, 

    updatePassword(email, newPassword) {
        return db('users').where('email', email).update({ password: newPassword });
    }, 
    findOne(filter) {
        return db('users').where(filter).first();
    }, 
    updateUser(id, updates) {
        return db('users').where('id', id).update(updates);
    }
    
};
