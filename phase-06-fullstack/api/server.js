const express = require('express')
const cors    = require('cors')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors())

// In-memory product store — resets when the container restarts (by design for phase 6)
let nextId   = 4
const products = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'Electronics' },
  { id: 2, name: 'Running Shoes',        price: 54.99, category: 'Footwear'   },
  { id: 3, name: 'Coffee Maker',         price: 39.99, category: 'Kitchen'    },
]

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'product-api', uptime: process.uptime() })
})

app.get('/products', (_req, res) => {
  res.json(products)
})

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id))
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

app.post('/products', (req, res) => {
  const { name, price, category } = req.body
  if (!name || price == null || !category) {
    return res.status(400).json({ error: 'name, price, and category are required' })
  }
  const product = { id: nextId++, name, price: Number(price), category }
  products.push(product)
  res.status(201).json(product)
})

app.put('/products/:id', (req, res) => {
  const idx = products.findIndex(p => p.id === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ error: 'Product not found' })
  const { name, price, category } = req.body
  if (!name || price == null || !category) {
    return res.status(400).json({ error: 'name, price, and category are required' })
  }
  products[idx] = { id: products[idx].id, name, price: Number(price), category }
  res.json(products[idx])
})

app.delete('/products/:id', (req, res) => {
  const idx = products.findIndex(p => p.id === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ error: 'Product not found' })
  products.splice(idx, 1)
  res.status(204).end()
})

app.listen(PORT, () => console.log(`product-api listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`))
