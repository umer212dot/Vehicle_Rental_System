const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    password: 'guccigamer22',
    host: 'localhost',
    port: 5432,
    database: 'test123'
})

module.exports = pool
