const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')
const os       = require('os')

const app  = express()
const PORT = process.env.PORT || 3001

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
    // Expose container hostname so you can see which replica served the request
    // when running with --scale api=2.
    replica: os.hostname(),
  })
})

app.get('/products', async (_req, res) => {
  res.json(await Product.find().sort({ createdAt: 1 }))
})

app.post('/products', async (req, res) => {
  const p = await Product.create({ ...req.body, price: Number(req.body.price) })
  res.status(201).json(p)
})

app.put('/products/:id', async (req, res) => {
  const p = await Product.findByIdAndUpdate(
    req.params.id,
    { ...req.body, price: Number(req.body.price) },
    { new: true, runValidators: true },
  )
  if (!p) return res.status(404).json({ error: 'Not found' })
  res.json(p)
})

app.delete('/products/:id', async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id)
  if (!p) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
})

app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }))

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/products')
  console.log(`product-api (${os.hostname()}) listening on port ${PORT}`)
  app.listen(PORT)
}

start().catch(err => { console.error(err); process.exit(1) })
