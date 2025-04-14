const { Pool } = require('pg')

const pool = new Pool({
    user: 'postgres',
    password: 'guccigamer22',
    host: 'localhost',
    port: 5432,
    database: 'Vehicle_Management_System'
})

// pool.query('SELECT * FROM vehicle').then(res => {
//     console.log(res.rows[0].model)
// }).catch(err => {
//     console.error(err)
// })

module.exports = pool
