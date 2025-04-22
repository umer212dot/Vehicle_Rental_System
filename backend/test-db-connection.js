const pool = require('./database');

console.log('Attempting to connect to database...');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database!', res.rows[0]);
  }
  pool.end();
}); 