const pool = require('./database');

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Database connection successful:', res.rows[0]);
  
  // Check if the users table exists and has data
  pool.query('SELECT * FROM users', (err, res) => {
    if (err) {
      console.error('Error querying users table:', err);
      process.exit(1);
    }
    
    console.log(`Found ${res.rows.length} users in the database:`);
    res.rows.forEach(user => {
      console.log(`- ${user.email}: ${user.password_hash} (${user.role})`);
    });
    
    // Test login for alice@example.com
    const testEmail = 'alice@example.com';
    const testPassword = 'hashed_pw_1';
    
    console.log(`\nTesting login for ${testEmail} with password ${testPassword}...`);
    
    pool.query('SELECT * FROM users WHERE email = $1', [testEmail], (err, res) => {
      if (err) {
        console.error('Error during login test:', err);
        process.exit(1);
      }
      
      if (res.rows.length === 0) {
        console.error(`ERROR: User ${testEmail} not found!`);
        process.exit(1);
      }
      
      const user = res.rows[0];
      console.log('User found:', user);
      
      if (user.password_hash === testPassword) {
        console.log('Password matches! Login should succeed.');
      } else {
        console.error(`ERROR: Password mismatch! Database has '${user.password_hash}' but we're testing with '${testPassword}'`);
      }
      
      pool.end();
    });
  });
}); 