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

    // Check for maintenance conflicts
    const maintenanceConflictQuery = `
      SELECT *
      FROM maintenance_record
      WHERE vehicle_id = $1
        AND status = 'Scheduled'
        AND maintenance_date BETWEEN $2 AND $3
    `;
    
    const maintenanceResult = await pool.query(maintenanceConflictQuery, [vehicle_id, rental_date, return_date]);
    const maintenanceConflicts = maintenanceResult.rows;
    
    if (maintenanceConflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Vehicle is scheduled for maintenance during the requested dates',
        conflicts: maintenanceConflicts
      });
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
    
    // First, get the rental details
    const rentalResult = await pool.query(
      'SELECT * FROM rental WHERE rental_id = $1',
      [rental_id]
    );
    
    if (rentalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    const rental = rentalResult.rows[0];
    
    // Check for maintenance conflicts
    const maintenanceConflictQuery = `
      SELECT *
      FROM maintenance_record
      WHERE vehicle_id = $1
        AND status = 'Scheduled'
        AND maintenance_date BETWEEN $2 AND $3
    `;
    
    const maintenanceResult = await pool.query(
      maintenanceConflictQuery, 
      [rental.vehicle_id, rental.rental_date, rental.return_date]
    );
    
    const maintenanceConflicts = maintenanceResult.rows;
    
    if (maintenanceConflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot approve rental: Vehicle is scheduled for maintenance during these dates',
        conflicts: maintenanceConflicts
      });
    }
    
    // Update rental status to 'Pending' (awaiting payment)
    const updateRental = await pool.query(
      'UPDATE rental SET status = $1 WHERE rental_id = $2 RETURNING *',
      ['Pending', rental_id]
    );
    
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
    const { rental_id, rating, comments } = req.body;
    
    // Validate required fields
    if (!rental_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Insert review
    const newReview = await pool.query(
      'INSERT INTO review (rental_id, rating, comments) VALUES ($1, $2, $3) RETURNING *',
      [rental_id, rating, comments]
    );
    
    res.status(201).json(newReview.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review', details: error.message });
  }
});

// Check if a rental has been reviewed
app.get('/reviews/check', async (req, res) => {
  try {
    const { rental_id } = req.query;
    
    // Validate required fields
    if (!rental_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if review exists
    const reviewCheck = await pool.query(
      'SELECT * FROM review WHERE rental_id = $1',
      [rental_id]
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
    const { rental_id, new_status, rental_date, return_date } = req.body;
    
    // If it's a specific rental update with new dates
    if (rental_id && (rental_date || return_date)) {
      // Get current rental data
      const currentRentalResult = await pool.query(
        'SELECT * FROM rental WHERE rental_id = $1',
        [rental_id]
      );
      
      if (currentRentalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Rental not found' });
      }
      
      const currentRental = currentRentalResult.rows[0];
      const updatedRentalDate = rental_date || currentRental.rental_date;
      const updatedReturnDate = return_date || currentRental.return_date;
      
      // Check for maintenance conflicts
      const maintenanceConflictQuery = `
        SELECT *
        FROM maintenance_record
        WHERE vehicle_id = $1
          AND status = 'Scheduled'
          AND maintenance_date BETWEEN $2 AND $3
      `;
      
      const maintenanceResult = await pool.query(
        maintenanceConflictQuery, 
        [currentRental.vehicle_id, updatedRentalDate, updatedReturnDate]
      );
      
      const maintenanceConflicts = maintenanceResult.rows;
      
      if (maintenanceConflicts.length > 0) {
        return res.status(409).json({ 
          error: 'Cannot update rental: Vehicle is scheduled for maintenance during these dates',
          conflicts: maintenanceConflicts
        });
      }
      
      // Update the rental with new dates and status
      const updateFields = [];
      const updateValues = [];
      let valueCounter = 1;
      
      if (rental_date) {
        updateFields.push(`rental_date = $${valueCounter}`);
        updateValues.push(rental_date);
        valueCounter++;
      }
      
      if (return_date) {
        updateFields.push(`return_date = $${valueCounter}`);
        updateValues.push(return_date);
        valueCounter++;
      }
      
      if (new_status) {
        updateFields.push(`status = $${valueCounter}`);
        updateValues.push(new_status);
        valueCounter++;
      }
      
      updateValues.push(rental_id);
      
      const updateQuery = `
        UPDATE rental 
        SET ${updateFields.join(', ')} 
        WHERE rental_id = $${valueCounter}
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      return res.json(updateResult.rows[0]);
    } else {
      // Original functionality - auto-update rentals based on date
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
      
      return res.json({ 
        updated: updateResult.rows.length,
        rentals: updateResult.rows
      });
    }
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
        COALESCE(AVG(r.rating), 0) as average_rating, 
        COUNT(*) as review_count 
      FROM review r
      JOIN rental rt ON r.rental_id = rt.rental_id
      WHERE rt.vehicle_id = $1`,
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
        rt.customer_id,
        c.name as customer_name
      FROM review r
      JOIN rental rt ON r.rental_id = rt.rental_id
      JOIN customer c ON rt.customer_id = c.customer_id
      WHERE rt.vehicle_id = $1
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


// Get popular vehicles
app.get('/analytics/popular-vehicles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.brand,
        v.model,
        v.image_path,
        COUNT(r.rental_id) as rental_count
      FROM vehicle v
      LEFT JOIN rental r ON v.vehicle_id = r.vehicle_id
      GROUP BY v.vehicle_id, v.brand, v.model, v.image_path
      ORDER BY rental_count DESC
      LIMIT 5
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting popular vehicles:', error);
    res.status(500).json({ error: 'Failed to get popular vehicles', details: error.message });
  }
});

// Get vehicle type distribution
app.get('/analytics/vehicle-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM vehicle
      GROUP BY type
      ORDER BY count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting vehicle type distribution:', error);
    res.status(500).json({ error: 'Failed to get vehicle type distribution', details: error.message });
  }
});

// Get revenue data
app.get('/analytics/revenue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', p.payment_date) as month,
        SUM(p.amount) as total_revenue
      FROM payment p
      WHERE p.payment_status = 'Completed'
      GROUP BY DATE_TRUNC('month', p.payment_date)
      ORDER BY month DESC
      LIMIT 12
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting revenue data:', error);
    res.status(500).json({ error: 'Failed to get revenue data', details: error.message });
  }
});

// Check if a rental has been reviewed
app.get('/reviews/check', async (req, res) => {
  try {
    const { rental_id } = req.query;
    
    // Validate required fields
    if (!rental_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if review exists
    const reviewCheck = await pool.query(
      'SELECT * FROM review WHERE rental_id = $1',
      [rental_id]
    );
    
    res.json({ 
      hasReviewed: reviewCheck.rows.length > 0
    });
  } catch (error) {
    console.error('Error checking review status:', error);
    res.status(500).json({ error: 'Failed to check review status', details: error.message });
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
      
      // Update vehicle's last maintenance date only
      const updateVehicleQuery = `
        UPDATE vehicle
        SET availability = availability
        WHERE vehicle_id = $1
        RETURNING *
      `;
      await client.query(
        updateVehicleQuery,
        [vehicle_id]
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
      
      // If status is updated, no need to update vehicle as maintenance_status doesn't exist
      if (status === 'Completed') {
        // Instead of updating non-existent columns, just log the completion
        console.log(`Maintenance ID ${maintenance_id} marked as completed for vehicle ${vehicle_id}`);
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
    const { scheduled_date, description, cost } = req.body;
    
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
        VALUES ($1, $2, $3, $4, 'Scheduled')
        RETURNING *
      `;
      const maintenanceResult = await client.query(
        insertMaintenanceQuery,
        [vehicle_id, description, cost || 0, scheduled_date]
      );
      
      // Get the vehicle data
      const vehicleResult = await client.query(
        'SELECT * FROM vehicle WHERE vehicle_id = $1',
        [vehicle_id]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        maintenance: maintenanceResult.rows[0],
        vehicle: vehicleResult.rows[0],
        status: 'Scheduled'
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
        (SELECT COUNT(*) FROM vehicle v 
         WHERE EXISTS (SELECT 1 FROM maintenance_record mr 
                      WHERE mr.vehicle_id = v.vehicle_id 
                      AND mr.status = 'Completed')) as vehicles_maintained,
        (SELECT COUNT(*) FROM vehicle v 
         WHERE EXISTS (SELECT 1 FROM maintenance_record mr 
                      WHERE mr.vehicle_id = v.vehicle_id 
                      AND mr.status = 'Ongoing')) as vehicles_in_maintenance,
        (SELECT COUNT(*) FROM vehicle v 
         WHERE EXISTS (SELECT 1 FROM maintenance_record mr 
                      WHERE mr.vehicle_id = v.vehicle_id 
                      AND mr.status = 'Scheduled')) as vehicles_scheduled,
        (SELECT COUNT(*) FROM vehicle v 
         WHERE EXISTS (SELECT 1 FROM maintenance_record mr 
                      WHERE mr.vehicle_id = v.vehicle_id 
                      AND mr.status = 'Notified to Admin')) as vehicles_notified,
        (SELECT COUNT(*) FROM vehicle v 
         WHERE NOT EXISTS (SELECT 1 FROM maintenance_record mr 
                          WHERE mr.vehicle_id = v.vehicle_id)) as vehicles_no_maintenance
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
  
  // Use actual current date for real-time status updates
  // or use a fixed date for testing
  const currentDate = new Date(2026, 3, 27); // 3 = April
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
    const vehicle = await pool.query('SELECT * FROM vehicle WHERE vehicle_id = $1', [vehicleId]);
    
    if (vehicle.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    // Get maintenance records
    const maintenanceRecords = await pool.query(
      'SELECT * FROM maintenance_record WHERE vehicle_id = $1 ORDER BY maintenance_date DESC',
      [vehicleId]
    );
    
    // Update status based on dates
    const updatedRecords = maintenanceRecords.rows.map(record => {
      const updatedRecord = updateMaintenanceStatusBasedOnDate(record);
      
      // If status changed, update in database
      if (updatedRecord.status !== record.status) {
        pool.query(
          'UPDATE maintenance_record SET status = $1 WHERE maintenance_id = $2',
          [updatedRecord.status, updatedRecord.maintenance_id]
        ).catch(err => console.error('Error updating status in DB:', err));
      }
      
      return updatedRecord;
    });
    
    res.json({
      vehicle: vehicle.rows[0],
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
    const records = await pool.query('SELECT * FROM maintenance_record ORDER BY maintenance_date DESC');
    
    // Update status based on dates
    const updatedRecords = records.rows.map(record => {
      const updatedRecord = updateMaintenanceStatusBasedOnDate(record);
      
      // If status changed, update in database
      if (updatedRecord.status !== record.status) {
        pool.query(
          'UPDATE maintenance_record SET status = $1 WHERE maintenance_id = $2',
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
    
    // Get the current maintenance record
    const currentRecord = await pool.query(
      'SELECT * FROM maintenance_record WHERE maintenance_id = $1',
      [maintenanceId]
    );
    
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }
    
    // Check if the current status is 'Ongoing' - can't cancel ongoing maintenance
    if (currentRecord.rows[0].status === 'Ongoing') {
      return res.status(403).json({ 
        error: 'Cannot cancel ongoing maintenance. Please complete the maintenance process first.' 
      });
    }
    
    // Update the status
    await pool.query(
      'UPDATE maintenance_record SET status = $1 WHERE maintenance_id = $2',
      [status, maintenanceId]
    );
    
    res.json({ message: 'Maintenance status updated successfully', status });
  } catch (error) {
    console.error('Error updating maintenance status:', error);
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
});

// Get vehicles with maintenance info
app.get('/vehicles/maintenance', async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { brand, model, type, color, transmission, maintenanceStatus } = req.query;
    
    // Build query with proper PostgreSQL placeholders
    let query = `
      SELECT v.*, 
        COALESCE(
          (SELECT description FROM maintenance_record 
           WHERE vehicle_id = v.vehicle_id 
           ORDER BY maintenance_date DESC LIMIT 1), 
           'No maintenance records'
        ) AS last_maintenance_description,
        COALESCE(
          (SELECT status FROM maintenance_record 
           WHERE vehicle_id = v.vehicle_id 
           ORDER BY maintenance_date DESC LIMIT 1), 
           'Good Condition'
        ) AS maintenance_status
      FROM vehicle v
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Add filters with proper PostgreSQL placeholders
    if (brand && brand !== 'All Brands') {
      query += ` AND v.brand = $${paramIndex++}`;
      params.push(brand);
    }
    
    if (model && model !== 'All Models') {
      query += ` AND v.model = $${paramIndex++}`;
      params.push(model);
    }
    
    if (type && type !== 'All Types') {
      query += ` AND v.type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (color && color !== 'All Colors') {
      query += ` AND v.color = $${paramIndex++}`;
      params.push(color);
    }
    
    if (transmission && transmission !== 'All Transmissions') {
      query += ` AND v.transmission = $${paramIndex++}`;
      params.push(transmission);
    }
    
    // Execute query with PostgreSQL style
    const vehiclesResult = await pool.query(query, params);
    const vehicles = vehiclesResult.rows;
    
    // Update maintenance status based on dates
    for (const vehicle of vehicles) {
      // maintenance_status here is a virtual property derived from the query, not an actual column
      if (vehicle.maintenance_status !== 'No maintenance records' && 
          vehicle.maintenance_status !== 'Good Condition' &&
          vehicle.maintenance_status !== 'Cancelled') {
        
        // Fetch latest maintenance record to update its status based on date
        const records = await pool.query(
          'SELECT * FROM maintenance_record WHERE vehicle_id = $1 ORDER BY maintenance_date DESC LIMIT 1',
          [vehicle.vehicle_id]
        );
        
        if (records.rows.length > 0) {
          const updatedRecord = updateMaintenanceStatusBasedOnDate(records.rows[0]);
          
          // Update the virtual maintenance_status in the vehicle object (just for this response)
          vehicle.maintenance_status = updatedRecord.status;
          
          // If status changed, update in maintenance_record table
          if (updatedRecord.status !== records.rows[0].status) {
            await pool.query(
              'UPDATE maintenance_record SET status = $1 WHERE maintenance_id = $2',
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

// Check if a date has existing bookings for a specific vehicle
app.get('/bookings/check-date', async (req, res) => {
  try {
    const { vehicleId, date } = req.query;
    
    if (!vehicleId || !date) {
      return res.status(400).json({ error: 'Vehicle ID and date are required' });
    }
    
    // Query to check if there are any active bookings for the specified date
    const bookingCheckQuery = `
      SELECT COUNT(*) as booking_count
      FROM rental
      WHERE vehicle_id = $1
        AND $2 BETWEEN rental_date AND return_date
        AND status NOT IN ('Cancelled', 'Completed')
    `;
    
    const result = await pool.query(bookingCheckQuery, [vehicleId, date]);
    const hasBooking = parseInt(result.rows[0].booking_count) > 0;
    
    res.json({ hasBooking });
  } catch (error) {
    console.error('Error checking for bookings:', error);
    res.status(500).json({ error: 'Failed to check for bookings', details: error.message });
  }
});

// Check for maintenance conflicts
app.get('/maintenance/check-conflicts', async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vehicle ID, start date, and end date are required' });
    }
    
    // Query to check if there are any scheduled maintenances in the date range
    const maintenanceConflictQuery = `
      SELECT *
      FROM maintenance_record
      WHERE vehicle_id = $1
        AND status = 'Scheduled'
        AND maintenance_date BETWEEN $2 AND $3
    `;
    
    const result = await pool.query(maintenanceConflictQuery, [vehicleId, startDate, endDate]);
    const conflicts = result.rows;
    
    res.json({ 
      hasConflicts: conflicts.length > 0,
      conflicts
    });
  } catch (error) {
    console.error('Error checking for maintenance conflicts:', error);
    res.status(500).json({ error: 'Failed to check for maintenance conflicts', details: error.message });
  }
});

// Get upcoming maintenance dates for a vehicle
app.get('/vehicles/:vehicle_id/maintenance-dates', async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    
    // Query to get scheduled maintenance dates for the vehicle
    const query = `
      SELECT 
        maintenance_id,
        maintenance_date,
        description,
        status
      FROM maintenance_record
      WHERE vehicle_id = $1
        AND status = 'Scheduled'
        AND maintenance_date >= CURRENT_DATE
      ORDER BY maintenance_date ASC
    `;
    
    const result = await pool.query(query, [vehicle_id]);
    
    res.json({
      vehicle_id,
      maintenance_dates: result.rows
    });
  } catch (error) {
    console.error('Error fetching vehicle maintenance dates:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance dates', details: error.message });
  }
});

// Check for maintenance conflicts for a specific vehicle and date range
app.get('/vehicles/:vehicle_id/check-maintenance-conflicts', async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    // Format dates for query
    const formattedStartDate = new Date(start_date).toISOString().split('T')[0];
    const formattedEndDate = new Date(end_date).toISOString().split('T')[0];
    
    // Query maintenance records that overlap with the requested date range
    const query = `
      SELECT * FROM maintenance_record 
      WHERE vehicle_id = $1 
      AND status = 'Scheduled'
      AND maintenance_date >= $2 
      AND maintenance_date <= $3
    `;
    
    const result = await pool.query(query, [vehicle_id, formattedStartDate, formattedEndDate]);
    
    if (result.rows.length > 0) {
      // Format the conflicts for client-side display
      const conflicts = result.rows.map(maintenance => ({
        date: maintenance.maintenance_date,
        description: maintenance.description,
        id: maintenance.maintenance_id
      }));
      
      return res.json({
        hasConflicts: true,
        conflicts
      });
    } else {
      return res.json({
        hasConflicts: false,
        conflicts: []
      });
    }
  } catch (error) {
    console.error('Error checking maintenance conflicts:', error);
    res.status(500).json({ error: 'Failed to check maintenance conflicts', details: error.message });
  }
});

// Daily maintenance status update scheduler
const scheduleMaintenanceStatusUpdates = () => {
  console.log('Setting up daily maintenance status update scheduler...');
  
  // Initial update on server start
  updateAllMaintenanceStatuses();
  
  // Set interval for daily updates (24 hours = 86,400,000 milliseconds)
  const dailyInterval = 24 * 60 * 60 * 1000;
  
  // Schedule regular updates
  setInterval(() => {
    updateAllMaintenanceStatuses();
  }, dailyInterval);
  
  console.log(`Maintenance status updates scheduled to run every 24 hours`);
};

// Function to execute the update_maintenance_status SQL procedure
const updateAllMaintenanceStatuses = async () => {
  try {
    console.log(`Running maintenance status update procedure at ${new Date().toISOString()}`);
    
    // Call the SQL procedure directly
    await pool.query('CALL update_maintenance_status()');
    
    console.log('Maintenance status update procedure executed successfully');
  } catch (error) {
    console.error('Error executing maintenance status update procedure:', error);
  }
};

// Start the maintenance status update scheduler when the server starts
scheduleMaintenanceStatusUpdates();

// Get available popular vehicles (for customer suggestions)
app.get('/analytics/available-popular-vehicles', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.brand,
        v.model,
        v.image_path,
        v.price_per_day,
        COUNT(r2.rental_id) as rental_count
      FROM vehicle v
      LEFT JOIN rental r2 ON v.vehicle_id = r2.vehicle_id AND r2.status != 'Cancelled'
      WHERE v.availability = true
      AND NOT EXISTS (
        SELECT 1 
        FROM rental r
        WHERE r.vehicle_id = v.vehicle_id 
        AND r.status = 'Ongoing'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM maintenance_record mr
        WHERE mr.vehicle_id = v.vehicle_id 
        AND mr.status IN ('In Progress', 'Scheduled')
      )
      GROUP BY v.vehicle_id, v.brand, v.model, v.image_path, v.price_per_day
      ORDER BY COUNT(r2.rental_id) DESC
      LIMIT 5
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting available popular vehicles:', error);
    res.status(500).json({ error: 'Failed to get available popular vehicles', details: error.message });
  }
});

