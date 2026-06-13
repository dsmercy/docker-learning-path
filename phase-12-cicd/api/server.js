const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors())

const Product = mongoose.model('Product', new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  price:    { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
}, { timestamps: true }))

app.get('/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded' })
})

app.get('/products', async (_req, res) => res.json(await Product.find().sort({ createdAt: 1 })))

app.post('/products', async (req, res) => {
  const p = await Product.create({ ...req.body, price: Number(req.body.price) })
  res.status(201).json(p)
})

app.put('/products/:id', async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, { ...req.body, price: Number(req.body.price) }, { new: true, runValidators: true })
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
  app.listen(PORT, () => console.log(`product-api listening on port ${PORT}`))
}

start().catch(err => { console.error(err); process.exit(1) })
