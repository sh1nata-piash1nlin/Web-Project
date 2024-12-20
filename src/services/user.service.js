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
    },

    // Add premium subscription
    addPremiumSubscription(premiumData) {
        return db('premium').insert(premiumData);
    },

    // Update user's subscription expiry
    updateSubscriptionExpiry(userId, expiryDate) {
        return db('users')
            .where('id', userId)
            .update({
                role: 'subscriber',
                subscription_expiry: expiryDate
            });
    }
};