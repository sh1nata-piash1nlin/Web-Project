const knexObj = require('knex')
const knex = knexObj({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'Hoanghoahong789',
        database: 'sql_webnews_db',
    },
    pool: {
        min: 0,
        max: 7,
    }
})

module.exports = knex;
