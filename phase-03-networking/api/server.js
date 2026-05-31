const express = require('express')

const app  = express()
const PORT = 3001

const products = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'Electronics',  stock: 42 },
  { id: 2, name: 'Running Shoes',        price: 54.99, category: 'Footwear',     stock: 18 },
  { id: 3, name: 'Coffee Maker',         price: 39.99, category: 'Kitchen',      stock: 7  },
  { id: 4, name: 'Yoga Mat',             price: 24.99, category: 'Sports',       stock: 31 },
  { id: 5, name: 'Desk Lamp',            price: 29.99, category: 'Home Office',  stock: 15 },
]

// Allow the frontend container (and browser dev) to reach this API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'product-api', timestamp: new Date().toISOString() })
})

app.get('/products', (_req, res) => {
  res.json(products)
})

app.listen(PORT, () => {
  console.log(`product-api listening on port ${PORT}`)
})
