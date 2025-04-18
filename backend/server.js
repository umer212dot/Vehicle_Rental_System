const express = require('express')
const app = express()
const cors = require('cors')
const pool = require('./database')
const port = 3060

//middleware
app.use(cors())
app.use(express.json())

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
    if (user.role === 'Customer') {
      const customerResult = await pool.query(
        'SELECT * FROM customer WHERE user_id = $1',
        [user.user_id]
      );
      
      if (customerResult.rows.length > 0) {
        customerDetails = customerResult.rows[0];
      }
    }

    // Return user data
    res.json({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      customer_id: customerDetails ? customerDetails.customer_id : null,
      name: customerDetails ? customerDetails.name : null
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
