const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('oauth', 'root', null, {
    host: 'localhost',
    dialect: 'mysql', 
    logging: false, 
}); 

//check connect to DB yet? 
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection DB has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = connectDB;