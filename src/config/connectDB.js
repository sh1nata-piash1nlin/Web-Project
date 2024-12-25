const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('oauth', 'root', 'duong', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        connectTimeout: 60000
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection DB has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;