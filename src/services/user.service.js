const db = require('../utils/db.js');

module.exports = {
    // Basic user operations
    add(entity) {
        return db('users').insert(entity);
    },

    findByUsername(email) {
        return db('users').where('email', email).first();
    },

    findOne(filter) {
        return db('users').where(filter).first();
    },

    // Update operations
    updateUser(id, updates) {
        return db('users').where('id', id).update(updates);
    },

    updatePassword(email, newPassword) {
        return db('users').where('email', email).update({ password: newPassword });
    },

    // Premium subscription operations
    addPremiumSubscription(premiumData) {
        return db('premium').insert(premiumData);
    },

    updateSubscriptionExpiry(userId, expiryDate) {
        return db('users')
            .where('id', userId)
            .update({
                role: 'subscriber',
                subscription_expiry: expiryDate
            });
    }
};