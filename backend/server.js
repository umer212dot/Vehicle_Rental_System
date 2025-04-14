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
    let {brand,model,type,color,transmission,minPrice, maxPrice} = req.query;

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

    const query = `
      SELECT * FROM vehicle
      WHERE ${whereClauses.join(' AND ')}
    `

    const searchResults = await pool.query(query, values);
    res.json(searchResults.rows);
  } catch (error) {
    console.error('Error in /search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})
//asfdasdf
//lola