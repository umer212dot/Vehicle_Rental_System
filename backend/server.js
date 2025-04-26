const express = require('express')
const app = express()
const cors = require('cors')
const pool = require('./database')
const port = 3060

//middleware
app.use(cors({
  origin: ['http://localhost:3060', 'http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

//insert
app.post('/test', async (req, res) => {
  const { text } = req.body
  const newTest = await pool.query('INSERT INTO test (text) VALUES ($1) RETURNING *', [text])
  console.log(newTest)
  res.json(newTest.rows[0])
})

//get all
app.get('/test', async (req, res) => {
  const allTests = await pool.query('SELECT * FROM test')
  res.json(allTests.rows)
})

//get one
app.get('/test/:id', async (req, res) => {
  const { id } = req.params
  const test = await pool.query('SELECT * FROM test WHERE id = $1', [id])
  res.json(test.rows[0])
})

//update
app.put('/test/:id', async (req, res) => {
  const { id } = req.params
  const { text } = req.body
  const updatedTest = await pool.query('UPDATE test SET text = $1 WHERE id = $2 RETURNING *', [text, id])
  res.json(updatedTest.rows[0])
})

//delete
app.delete('/test/:id', async (req, res) => {
  const { id } = req.params
  const deletedTest = await pool.query('DELETE FROM test WHERE id = $1 RETURNING *', [id])
  res.json(deletedTest.rows[0])
})

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



//search page

app.get('/models/:brand', async (req, res) => {
  const { brand } = req.params
  const searchResults = await pool.query('SELECT distinct model FROM vehicle WHERE brand = $1', [brand])
  res.json(searchResults.rows)
})

app.get('/search', async (req, res) => {
  try {
    let {brand,model,type,color,transmission,minPrice, maxPrice,availability} = req.query;

    // Set default price range
    minPrice = minPrice ? parseInt(minPrice) : 0;
    maxPrice = maxPrice ? parseInt(maxPrice) : 99999;

    const values = [];
    let whereClauses = ['price_per_day BETWEEN $1 AND $2'];
    values.push(minPrice, maxPrice);

    // Dynamically add filters if provided
    if (brand) {
      values.push(brand);
      whereClauses.push(`brand = $${values.length}`);
    }
    if (model) {
      values.push(model);
      whereClauses.push(`model = $${values.length}`);
    }
    if (type) {
      values.push(type);
      whereClauses.push(`type = $${values.length}`);
    }
    if (color) {
      values.push(color);
      whereClauses.push(`color = $${values.length}`);
    }
    if (transmission) {
      values.push(transmission);
      whereClauses.push(`transmission = $${values.length}`);
    }
    if(availability){
      values.push(availability);
      whereClauses.push(`availability = $${values.length}`);
    }

    const query = `
      SELECT * FROM vehicle
      WHERE ${whereClauses.join(' AND ')}
    `
    console.log(query)
    const searchResults = await pool.query(query, values);
    res.json(searchResults.rows);
  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

// Create a new rental booking
app.post('/rentals', async (req, res) => {
  try {
    // Extract data from request body
    const { 
      customer_id, 
      vehicle_id, 
      rental_date, 
      return_date, 
      total_fee
    } = req.body;

    // Validate required fields
    if (!customer_id || !vehicle_id || !rental_date || !return_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert the rental into the database with 'Awaiting Approval' status
    const newRental = await pool.query(
      'INSERT INTO rental (customer_id, vehicle_id, rental_date, return_date, total_fee, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id, vehicle_id, rental_date, return_date, total_fee, 'Awaiting Approval']
    );

    // Vehicle remains available until admin approves the booking

    // Return the created rental
    res.status(201).json(newRental.rows[0]);
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({ error: 'Failed to create rental', details: error.message });
  }
});

// Get all bookings (for admin)
app.get('/rentals/all', async (req, res) => {
  try {
    // Get all rentals with associated vehicle and customer details
    const bookingsQuery = `
      SELECT r.*, v.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM rental r
      JOIN vehicle v ON r.vehicle_id = v.vehicle_id
      JOIN customer c ON r.customer_id = c.customer_id
      ORDER BY 
        CASE 
          WHEN r.status = 'Awaiting Approval' THEN 1
          WHEN r.status = 'Pending' THEN 2
          WHEN r.status = 'Ongoing' THEN 3
          WHEN r.status = 'Completed' THEN 4
          WHEN r.status = 'Cancelled' THEN 5
          ELSE 6
        END,
        r.rental_date DESC
    `;
    
    const bookingsResult = await pool.query(bookingsQuery);
    
    // Format the results to include vehicle and customer as nested objects
    const formattedBookings = bookingsResult.rows.map(row => {
      const { 
        rental_id, customer_id, vehicle_id, rental_date, 
        return_date, status, total_fee, customer_name, customer_email, customer_phone
      } = row;
      
      // Extract vehicle fields
      const vehicle = {
        vehicle_id,
        brand: row.brand,
        model: row.model,
        type: row.type,
        color: row.color,
        year: row.year,
        price_per_day: row.price_per_day,
        image_path: row.image_path,
        transmission: row.transmission,
        availability: row.availability
      };
      
      // Extract customer fields
      const customer = {
        customer_id,
        name: customer_name,
        email: customer_email,
        phone: customer_phone
      };
      
      return {
        rental_id,
        customer_id,
        vehicle_id,
        rental_date,
        return_date,
        status,
        total_fee,
        vehicle,
        customer
      };
    });
    
    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

// Admin approval for booking
app.put('/rentals/:rental_id/approve', async (req, res) => {
  try {
    const { rental_id } = req.params;
    
    // Update rental status to 'Pending' (awaiting payment)
    const updateRental = await pool.query(
      'UPDATE rental SET status = $1 WHERE rental_id = $2 RETURNING *',
      ['Pending', rental_id]
    );
    
    if (updateRental.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    res.json(updateRental.rows[0]);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ error: 'Failed to approve booking', details: error.message });
  }
});

// Admin rejection for booking
app.put('/rentals/:rental_id/reject', async (req, res) => {
  try {
    const { rental_id } = req.params;
    
    // Update rental status to 'Cancelled'
    const updateRental = await pool.query(
      'UPDATE rental SET status = $1 WHERE rental_id = $2 RETURNING *',
      ['Cancelled', rental_id]
    );
    
    if (updateRental.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    res.json(updateRental.rows[0]);
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: 'Failed to reject booking', details: error.message });
  }
});

// User register
app.post('/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    const { email, password, name, phone, licenseNumber } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Always enforce Customer role for registrations
    const role = 'Customer';

    // Check if user with this email already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('Email already registered:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Start a transaction
    const client = await pool.connect();
    console.log('Starting transaction');
    
    try {
      await client.query('BEGIN');
      
      // Insert user record
      console.log('Inserting user record');
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
        [email, password, role]
      );
      
      const userId = userResult.rows[0].user_id;
      console.log('User created with ID:', userId);
      
      // Insert customer record since role is always Customer
      console.log('Inserting customer record');
      await client.query(
        'INSERT INTO customer (name, email, phone, license_number, user_id) VALUES ($1, $2, $3, $4, $5)',
        [name, email, phone, licenseNumber, userId]
      );
      
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      res.status(201).json({ 
        message: 'Registration successful', 
        userId: userId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error, rolled back:', error);
      throw error;
    } finally {
      client.release();
      console.log('Client released');
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    
    // In a real application, you would verify the password hash here
    // For simplicity, we're just checking if the password matches directly
    // This is NOT secure for a production environment
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get customer details if user is a customer
    let customerDetails = null;
    let adminDetails = null;
    let name = null;
    
    if (user.role === 'Customer') {
      const customerResult = await pool.query(
        'SELECT * FROM customer WHERE user_id = $1',
        [user.user_id]
      );
      
      if (customerResult.rows.length > 0) {
        customerDetails = customerResult.rows[0];
        name = customerDetails.name;
      }
    } else if (user.role === 'Admin') {
      const adminResult = await pool.query(
        'SELECT * FROM admin WHERE user_id = $1',
        [user.user_id]
      );
      
      if (adminResult.rows.length > 0) {
        adminDetails = adminResult.rows[0];
        name = adminDetails.name;
      }
    }

    // Return user data
    res.json({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      customer_id: customerDetails ? customerDetails.customer_id : null,
      admin_id: adminDetails ? adminDetails.admin_id : null,
      name: name
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to authenticate user', details: error.message });
  }
});

// Get customer bookings
app.get('/rentals/customer/:customer_id', async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    // Get all rentals for the customer with associated vehicle details
    const bookingsQuery = `
      SELECT r.*, v.* 
      FROM rental r
      JOIN vehicle v ON r.vehicle_id = v.vehicle_id
      WHERE r.customer_id = $1
      ORDER BY r.rental_date DESC
    `;
    
    const bookingsResult = await pool.query(bookingsQuery, [customer_id]);
    
    // Format the results to include vehicle as a nested object
    const formattedBookings = bookingsResult.rows.map(row => {
      const { 
        rental_id, customer_id, vehicle_id, rental_date, 
        return_date, status, total_fee 
      } = row;
      
      // Extract vehicle fields
      const vehicle = {
        vehicle_id,
        brand: row.brand,
        model: row.model,
        type: row.type,
        color: row.color,
        year: row.year,
        price_per_day: row.price_per_day,
        image_path: row.image_path,
        transmission: row.transmission,
        availability: row.availability
      };
      
      return {
        rental_id,
        customer_id,
        vehicle_id,
        rental_date,
        return_date,
        status,
        total_fee,
        vehicle
      };
    });
    
    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

// Process payment
app.post('/payments', async (req, res) => {
  try {
    const { rental_id, amount, payment_status } = req.body;
    
    // Validate required fields
    if (!rental_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert payment record
    const newPayment = await pool.query(
      'INSERT INTO payment (rental_id, amount, payment_status) VALUES ($1, $2, $3) RETURNING *',
      [rental_id, amount, payment_status || 'Pending']
    );
    
    // If payment status is Completed, update rental status to Ongoing
    // The database trigger will automatically mark the vehicle as unavailable
    if (payment_status === 'Completed') {
      await pool.query(
        'UPDATE rental SET status = $1 WHERE rental_id = $2',
        ['Ongoing', rental_id]
      );
    }
    
    res.status(201).json(newPayment.rows[0]);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment', details: error.message });
  }
});

// Submit review
app.post('/reviews', async (req, res) => {
  try {
    const { customer_id, vehicle_id, rating, comments } = req.body;
    
    // Validate required fields
    if (!customer_id || !vehicle_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Insert review
    const newReview = await pool.query(
      'INSERT INTO review (customer_id, vehicle_id, rating, comments) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_id, vehicle_id, rating, comments]
    );
    
    res.status(201).json(newReview.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review', details: error.message });
  }
});

// Check if customer has already reviewed a vehicle
app.get('/reviews/check', async (req, res) => {
  try {
    const { customer_id, vehicle_id } = req.query;
    
    // Validate required fields
    if (!customer_id || !vehicle_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if review exists
    const reviewCheck = await pool.query(
      'SELECT * FROM review WHERE customer_id = $1 AND vehicle_id = $2',
      [customer_id, vehicle_id]
    );
    
    res.json({ 
      hasReviewed: reviewCheck.rows.length > 0
    });
  } catch (error) {
    console.error('Error checking review status:', error);
    res.status(500).json({ error: 'Failed to check review status', details: error.message });
  }
});

// Update rental status from 'Ongoing' to 'Completed' when return date has passed
app.put('/rentals/update-status', async (req, res) => {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    // const currentDate = new Date(2026,4,20)
    // Find rentals that are 'Ongoing' and have return dates before or equal to current date
    // The database trigger will automatically update vehicle availability
    const updateResult = await pool.query(
      `UPDATE rental 
       SET status = 'Completed' 
       WHERE status = 'Ongoing' AND return_date <= $1
       RETURNING rental_id, vehicle_id`,
      [currentDate]
    );
    
    res.json({ 
      updated: updateResult.rows.length,
      rentals: updateResult.rows
    });
  } catch (error) {
    console.error('Error updating rental status:', error);
    res.status(500).json({ error: 'Failed to update rental status', details: error.message });
  }
});

// Get average rating for a vehicle
app.get('/vehicles/:vehicle_id/rating', async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    
    // Get average rating and count of reviews
    const ratingResult = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0) as average_rating, 
        COUNT(*) as review_count 
      FROM review 
      WHERE vehicle_id = $1`,
      [vehicle_id]
    );
    
    const { average_rating, review_count } = ratingResult.rows[0];
    
    res.json({
      vehicle_id,
      average_rating: parseFloat(average_rating).toFixed(1),
      review_count: parseInt(review_count)
    });
  } catch (error) {
    console.error('Error getting vehicle rating:', error);
    res.status(500).json({ error: 'Failed to get vehicle rating', details: error.message });
  }
});

// Get all reviews for a vehicle with customer details
app.get('/vehicles/:vehicle_id/reviews', async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    
    // Get reviews with customer names
    const reviewsResult = await pool.query(
      `SELECT 
        r.review_id, 
        r.rating, 
        r.comments, 
        r.review_date,
        c.customer_id,
        c.name as customer_name
      FROM review r
      JOIN customer c ON r.customer_id = c.customer_id
      WHERE r.vehicle_id = $1
      ORDER BY r.review_date DESC`,
      [vehicle_id]
    );
    
    // Get vehicle details
    const vehicleResult = await pool.query(
      `SELECT * FROM vehicle WHERE vehicle_id = $1`,
      [vehicle_id]
    );
    
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({
      vehicle: vehicleResult.rows[0],
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error('Error getting vehicle reviews:', error);
    res.status(500).json({ error: 'Failed to get vehicle reviews', details: error.message });
  }
});

// Get all vehicles with maintenance status
// app.get('/vehicles/maintenance', async (req, res) => {
//   try {
//     let {brand, model, type, color, transmission, minPrice, maxPrice, maintenanceStatus} = req.query;

//     // Set default price range
//     minPrice = minPrice ? parseInt(minPrice) : 0;
//     maxPrice = maxPrice ? parseInt(maxPrice) : 99999;

//     const values = [];
//     let whereClauses = ['v.price_per_day BETWEEN $1 AND $2'];
//     values.push(minPrice, maxPrice);

//     // Dynamically add filters if provided
//     if (brand) {
//       values.push(brand);
//       whereClauses.push(`v.brand = $${values.length}`);
//     }
//     if (model) {
//       values.push(model);
//       whereClauses.push(`v.model = $${values.length}`);
//     }
//     if (type) {
//       values.push(type);
//       whereClauses.push(`v.type = $${values.length}`);
//     }
//     if (color) {
//       values.push(color);
//       whereClauses.push(`v.color = $${values.length}`);
//     }
//     if (transmission) {
//       values.push(transmission);
//       whereClauses.push(`v.transmission = $${values.length}`);
//     }
//     if (maintenanceStatus) {
//       values.push(maintenanceStatus);
//       whereClauses.push(`v.maintenance_status = $${values.length}`);
//     }

//     const query = `
//       SELECT 
//         v.*,
//         COALESCE(v.maintenance_status::text, 'No Records') as maintenance_status_text,
//         COALESCE(
//           (SELECT m.description 
//            FROM maintenance_record m 
//            WHERE m.vehicle_id = v.vehicle_id 
//            ORDER BY m.maintenance_date DESC 
//            LIMIT 1), 
//           'No maintenance records'
//         ) as last_maintenance_description,
//         (SELECT COUNT(*) FROM maintenance_record m WHERE m.vehicle_id = v.vehicle_id) as maintenance_count
//       FROM vehicle v
//       WHERE ${whereClauses.join(' AND ')}
//       ORDER BY v.brand, v.model
//     `;
    
//     console.log('Maintenance query:', query);
//     const vehiclesResult = await pool.query(query, values);
    
//     res.json(vehiclesResult.rows);
//   } catch (error) {
//     console.error('Error in /vehicles/maintenance:', error);
//     res.status(500).json({ error: 'Internal Server Error', details: error.message });
//   }
// });

app.get('/vehicles/maintenance', async (req, res) => {
  try {
    let { brand, model, type, color, transmission } = req.query;

    const values = [];
    let whereClauses = [];

    if (brand) {
      values.push(brand);
      whereClauses.push(`v.brand = $${values.length}`);
    }
    if (model) {
      values.push(model);
      whereClauses.push(`v.model = $${values.length}`);
    }
    if (type) {
      values.push(type);
      whereClauses.push(`v.type = $${values.length}`);
    }
    if (color) {
      values.push(color);
      whereClauses.push(`v.color = $${values.length}`);
    }
    if (transmission) {
      values.push(transmission);
      whereClauses.push(`v.transmission = $${values.length}`);
    }

    // Build WHERE clause if any filters were applied
    const whereClause = whereClauses.length > 0 
      ? `WHERE ${whereClauses.join(' AND ')}` 
      : '';

    const query = `
      SELECT 
        v.*,
        COALESCE(
          (SELECT m.description 
           FROM maintenance_record m 
           WHERE m.vehicle_id = v.vehicle_id 
           ORDER BY m.maintenance_date DESC 
           LIMIT 1), 
          'No maintenance records'
        ) as last_maintenance_description,
        (SELECT COUNT(*) FROM maintenance_record m WHERE m.vehicle_id = v.vehicle_id) as maintenance_count
      FROM vehicle v
      ${whereClause}
      ORDER BY v.brand, v.model
    `;

    console.log('Maintenance query:', query);
    const vehiclesResult = await pool.query(query, values);

    res.json(vehiclesResult.rows);
  } catch (error) {
    console.error('Error in /vehicles/maintenance:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});


// Get maintenance history for a specific vehicle
app.get('/vehicles/:vehicle_id/maintenance', async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    
    // Get vehicle details
    const vehicleQuery = `
      SELECT * FROM vehicle WHERE vehicle_id = $1
    `;
    const vehicleResult = await pool.query(vehicleQuery, [vehicle_id]);
    
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Get maintenance records for the vehicle
    const maintenanceQuery = `
      SELECT * FROM maintenance_record 
      WHERE vehicle_id = $1
      ORDER BY maintenance_date DESC
    `;
    const maintenanceResult = await pool.query(maintenanceQuery, [vehicle_id]);
    
    res.json({
      vehicle: vehicleResult.rows[0],
      maintenance_records: maintenanceResult.rows
    });
  } catch (error) {
    console.error('Error fetching vehicle maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance records', details: error.message });
  }
});

// Add new maintenance record
app.post('/maintenance', async (req, res) => {
  try {
    const { vehicle_id, description, cost, maintenance_date, status } = req.body;
    
    // Validate required fields
    if (!vehicle_id || !description || !cost || !maintenance_date || !status) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert maintenance record
      const maintenanceQuery = `
        INSERT INTO maintenance_record (vehicle_id, description, cost, maintenance_date, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const maintenanceResult = await client.query(
        maintenanceQuery,
        [vehicle_id, description, cost, maintenance_date, status]
      );
      
      // Update vehicle's maintenance status and last maintenance date
      const updateVehicleQuery = `
        UPDATE vehicle
        SET maintenance_status = $1, last_maintenance_date = $2
        WHERE vehicle_id = $3
        RETURNING *
      `;
      await client.query(
        updateVehicleQuery,
        [status, maintenance_date, vehicle_id]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json(maintenanceResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    res.status(500).json({ error: 'Failed to add maintenance record', details: error.message });
  }
});

// Update maintenance status
app.put('/maintenance/:maintenance_id', async (req, res) => {
  try {
    const { maintenance_id } = req.params;
    const { status, description, cost, maintenance_date } = req.body;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the vehicle_id from the maintenance record
      const getMaintenanceQuery = `
        SELECT vehicle_id FROM maintenance_record WHERE maintenance_id = $1
      `;
      const maintenanceResult = await client.query(getMaintenanceQuery, [maintenance_id]);
      
      if (maintenanceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Maintenance record not found' });
      }
      
      const vehicle_id = maintenanceResult.rows[0].vehicle_id;
      
      // Update the maintenance record
      const updateMaintenanceQuery = `
        UPDATE maintenance_record
        SET status = COALESCE($1, status),
            description = COALESCE($2, description),
            cost = COALESCE($3, cost),
            maintenance_date = COALESCE($4, maintenance_date)
        WHERE maintenance_id = $5
        RETURNING *
      `;
      const updateResult = await client.query(
        updateMaintenanceQuery,
        [status, description, cost, maintenance_date, maintenance_id]
      );
      
      // If status is updated, also update vehicle maintenance status
      if (status) {
        const updateVehicleQuery = `
          UPDATE vehicle
          SET maintenance_status = $1,
              last_maintenance_date = CASE 
                WHEN $1 = 'Completed' THEN COALESCE($2, last_maintenance_date)
                ELSE last_maintenance_date
              END
          WHERE vehicle_id = $3
        `;
        await client.query(
          updateVehicleQuery,
          [status, maintenance_date, vehicle_id]
        );
      }
      
      await client.query('COMMIT');
      
      res.json(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: 'Failed to update maintenance record', details: error.message });
  }
});

// Schedule maintenance for a vehicle
app.post('/vehicles/:vehicle_id/schedule-maintenance', async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const { scheduled_date, description } = req.body;
    
    // Validate required fields
    if (!scheduled_date || !description) {
      return res.status(400).json({ error: 'Scheduled date and description are required' });
    }
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a new maintenance record with 'Scheduled' status
      const insertMaintenanceQuery = `
        INSERT INTO maintenance_record (vehicle_id, description, cost, maintenance_date, status)
        VALUES ($1, $2, 0, $3, 'Scheduled')
        RETURNING *
      `;
      const maintenanceResult = await client.query(
        insertMaintenanceQuery,
        [vehicle_id, description, scheduled_date]
      );
      
      // Update vehicle's next maintenance date and status if not already in maintenance
      const updateVehicleQuery = `
        UPDATE vehicle
        SET next_maintenance_date = $1,
            maintenance_status = CASE
              WHEN maintenance_status IS NULL OR maintenance_status = 'Completed' THEN 'Scheduled'
              ELSE maintenance_status
            END
        WHERE vehicle_id = $2
        RETURNING *
      `;
      const vehicleResult = await client.query(
        updateVehicleQuery,
        [scheduled_date, vehicle_id]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        maintenance: maintenanceResult.rows[0],
        vehicle: vehicleResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    res.status(500).json({ error: 'Failed to schedule maintenance', details: error.message });
  }
});

// Get maintenance statistics
app.get('/maintenance/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'Ongoing') as ongoing_count,
        COUNT(*) FILTER (WHERE status = 'Scheduled') as scheduled_count,
        COUNT(*) FILTER (WHERE status = 'Notified to Admin') as notified_count,
        SUM(cost) as total_cost,
        AVG(cost) as average_cost
      FROM maintenance_record
    `;
    
    const vehicleStatsQuery = `
      SELECT
        COUNT(*) as total_vehicles,
        COUNT(*) FILTER (WHERE maintenance_status = 'Completed') as vehicles_maintained,
        COUNT(*) FILTER (WHERE maintenance_status = 'Ongoing') as vehicles_in_maintenance,
        COUNT(*) FILTER (WHERE maintenance_status = 'Scheduled') as vehicles_scheduled,
        COUNT(*) FILTER (WHERE maintenance_status = 'Notified to Admin') as vehicles_notified,
        COUNT(*) FILTER (WHERE maintenance_status IS NULL) as vehicles_no_maintenance
      FROM vehicle
    `;
    
    const statsResult = await pool.query(statsQuery);
    const vehicleStatsResult = await pool.query(vehicleStatsQuery);
    
    res.json({
      maintenance_stats: statsResult.rows[0],
      vehicle_stats: vehicleStatsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance statistics', details: error.message });
  }
});

// Function to update maintenance status based on dates
const updateMaintenanceStatusBasedOnDate = (record) => {
  if (!record || !record.maintenance_date || record.status === 'Cancelled') {
    return record;
  }
  
  const maintenanceDate = new Date(record.maintenance_date);
  maintenanceDate.setHours(0, 0, 0, 0); // Reset time part for proper comparison
  
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time part for proper comparison
  
  let newStatus = record.status;
  
  // If maintenance date is in the future -> Scheduled
  if (maintenanceDate > currentDate) {
    newStatus = 'Scheduled';
  } 
  // If maintenance date is today -> Ongoing
  else if (maintenanceDate.getTime() === currentDate.getTime()) {
    newStatus = 'Ongoing';
  } 
  // If maintenance date is in the past -> Completed
  else if (maintenanceDate < currentDate) {
    newStatus = 'Completed';
  }
  
  // Only update if status has changed
  if (newStatus !== record.status) {
    record.status = newStatus;
  }
  
  return record;
};

// Get maintenance records for a specific vehicle
app.get('/vehicles/:vehicleId/maintenance', async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    
    // First check if vehicle exists
    const [vehicle] = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = ?', [vehicleId]);
    
    if (vehicle.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Get maintenance records
    const [maintenanceRecords] = await pool.query(
      'SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY maintenance_date DESC',
      [vehicleId]
    );
    
    // Update status based on dates
    const updatedRecords = maintenanceRecords.map(record => {
      const updatedRecord = updateMaintenanceStatusBasedOnDate(record);
      
      // If status changed, update in database
      if (updatedRecord.status !== record.status) {
        pool.query(
          'UPDATE maintenance SET status = ? WHERE maintenance_id = ?',
          [updatedRecord.status, updatedRecord.maintenance_id]
        ).catch(err => console.error('Error updating status in DB:', err));
      }
      
      return updatedRecord;
    });
    
    res.json({
      vehicle: vehicle[0],
      maintenance_records: updatedRecords
    });
  } catch (error) {
    console.error('Error getting maintenance records:', error);
    res.status(500).json({ error: 'Failed to get maintenance records' });
  }
});

// Get all maintenance records with auto-update of status based on date
app.get('/maintenance/all', async (req, res) => {
  try {
    const [records] = await pool.query('SELECT * FROM maintenance ORDER BY maintenance_date DESC');
    
    // Update status based on dates
    const updatedRecords = records.map(record => {
      const updatedRecord = updateMaintenanceStatusBasedOnDate(record);
      
      // If status changed, update in database
      if (updatedRecord.status !== record.status) {
        pool.query(
          'UPDATE maintenance SET status = ? WHERE maintenance_id = ?',
          [updatedRecord.status, updatedRecord.maintenance_id]
        ).catch(err => console.error('Error updating status in DB:', err));
      }
      
      return updatedRecord;
    });
    
    res.json(updatedRecords);
  } catch (error) {
    console.error('Error getting all maintenance records:', error);
    res.status(500).json({ error: 'Failed to get maintenance records' });
  }
});

// Update maintenance status endpoint - only allow cancellation through this endpoint
app.put('/maintenance/:maintenanceId/status', async (req, res) => {
  try {
    const maintenanceId = req.params.maintenanceId;
    const { status } = req.body;
    
    // Check if status is 'Cancelled' - this is the only manual update allowed
    if (status !== 'Cancelled') {
      return res.status(400).json({ 
        error: 'Only cancellation is allowed through this endpoint. Other statuses are updated automatically based on date.' 
      });
    }
    
    // Update the status
    await pool.query(
      'UPDATE maintenance SET status = ? WHERE maintenance_id = ?',
      [status, maintenanceId]
    );
    
    res.json({ message: 'Maintenance status updated successfully', status });
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
});

// Schedule maintenance for a vehicle
app.post('/vehicles/:vehicleId/schedule-maintenance', async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const { scheduled_date, description, cost } = req.body;
    
    // Validation
    if (!scheduled_date || !description) {
      return res.status(400).json({ error: 'Scheduled date and description are required' });
    }
    
    // Check if vehicle exists
    const [vehicle] = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = ?', [vehicleId]);
    
    if (vehicle.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Determine status based on date
    const maintenanceDate = new Date(scheduled_date);
    maintenanceDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    let status;
    
    if (maintenanceDate > currentDate) {
      status = 'Scheduled';
    } else if (maintenanceDate.getTime() === currentDate.getTime()) {
      status = 'Ongoing';
    } else {
      status = 'Completed';
    }
    
    // Insert maintenance record
    const [result] = await pool.query(
      'INSERT INTO maintenance (vehicle_id, maintenance_date, description, status, cost) VALUES (?, ?, ?, ?, ?)',
      [vehicleId, scheduled_date, description, status, cost || 0]
    );
    
    res.status(201).json({
      message: 'Maintenance scheduled successfully',
      maintenance_id: result.insertId,
      status
    });
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
});

// Get vehicles with maintenance info
app.get('/vehicles/maintenance', async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { brand, model, type, color, transmission, maintenanceStatus } = req.query;
    
    let query = `
      SELECT v.*, 
        COALESCE(
          (SELECT description FROM maintenance 
           WHERE vehicle_id = v.vehicle_id 
           ORDER BY maintenance_date DESC LIMIT 1), 
           'No maintenance records'
        ) AS last_maintenance_description,
        COALESCE(
          (SELECT status FROM maintenance 
           WHERE vehicle_id = v.vehicle_id 
           ORDER BY maintenance_date DESC LIMIT 1), 
           'Good Condition'
        ) AS maintenance_status
      FROM vehicles v
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add filters
    if (brand && brand !== 'All Brands') {
      query += ' AND v.brand = ?';
      params.push(brand);
    }
    
    if (model && model !== 'All Models') {
      query += ' AND v.model = ?';
      params.push(model);
    }
    
    if (type && type !== 'All Types') {
      query += ' AND v.type = ?';
      params.push(type);
    }
    
    if (color && color !== 'All Colors') {
      query += ' AND v.color = ?';
      params.push(color);
    }
    
    if (transmission && transmission !== 'All Transmissions') {
      query += ' AND v.transmission = ?';
      params.push(transmission);
    }
    
    // Execute query
    const [vehicles] = await pool.query(query, params);
    
    // Update maintenance status based on dates
    for (const vehicle of vehicles) {
      if (vehicle.maintenance_status !== 'No maintenance records' && 
          vehicle.maintenance_status !== 'Good Condition' &&
          vehicle.maintenance_status !== 'Cancelled') {
        
        // Fetch latest maintenance record to update its status based on date
        const [records] = await pool.query(
          'SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY maintenance_date DESC LIMIT 1',
          [vehicle.vehicle_id]
        );
        
        if (records.length > 0) {
          const updatedRecord = updateMaintenanceStatusBasedOnDate(records[0]);
          
          // Update vehicle's maintenance status
          vehicle.maintenance_status = updatedRecord.status;
          
          // If status changed, update in database
          if (updatedRecord.status !== records[0].status) {
            await pool.query(
              'UPDATE maintenance SET status = ? WHERE maintenance_id = ?',
              [updatedRecord.status, updatedRecord.maintenance_id]
            );
          }
        }
      }
    }
    
    // Apply maintenance status filter if specified
    if (maintenanceStatus && maintenanceStatus !== 'All Statuses') {
      const filteredVehicles = vehicles.filter(
        vehicle => vehicle.maintenance_status === maintenanceStatus
      );
      return res.json(filteredVehicles);
    }
    
    res.json(vehicles);
  } catch (error) {
    console.error('Error getting vehicles with maintenance info:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});
