const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')

const app  = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products'

app.use(express.json())
app.use(cors())

const productSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  price:    { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    service: 'product-api',
  })
})

app.get('/products', async (_req, res) => {
  const products = await Product.find().sort({ createdAt: 1 })
  res.json(products)
})

app.post('/products', async (req, res) => {
  const { name, price, category } = req.body
  const product = await Product.create({ name, price: Number(price), category })
  res.status(201).json(product)
})

app.put('/products/:id', async (req, res) => {
  const { name, price, category } = req.body
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { name, price: Number(price), category },
    { new: true, runValidators: true },
  )
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

app.delete('/products/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.status(204).end()
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

async function start() {
  await mongoose.connect(MONGODB_URI)
  console.log('MongoDB connected')
  app.listen(PORT, () => console.log(`product-api listening on port ${PORT}`))
}

start().catch(err => { console.error('Startup error:', err); process.exit(1) })
