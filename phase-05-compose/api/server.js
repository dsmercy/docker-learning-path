const express    = require('express')
const { createClient } = require('redis')

const app  = express()
const PORT = process.env.PORT || 3001

// Redis client — REDIS_URL is injected by Compose via environment:
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })

redisClient.on('error', err => console.error('Redis error:', err))

async function init() {
  await redisClient.connect()
  console.log('Connected to Redis')

  app.use(express.json())
  app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); next() })

  const products = [
    { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'Electronics' },
    { id: 2, name: 'Running Shoes',        price: 54.99, category: 'Footwear'   },
    { id: 3, name: 'Coffee Maker',         price: 39.99, category: 'Kitchen'    },
    { id: 4, name: 'Yoga Mat',             price: 24.99, category: 'Sports'     },
    { id: 5, name: 'Desk Lamp',            price: 29.99, category: 'Home Office'},
  ]

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'product-api' })
  })

  app.get('/products', (_req, res) => {
    res.json(products)
  })

  // ── Cart endpoints (backed by Redis) ──────────────────────────────────────

  app.get('/cart/:sessionId', async (req, res) => {
    const raw  = await redisClient.get(`cart:${req.params.sessionId}`)
    const cart = raw ? JSON.parse(raw) : []
    res.json(cart)
  })

  app.post('/cart/:sessionId', async (req, res) => {
    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'productId required' })

    const product = products.find(p => p.id === Number(productId))
    if (!product) return res.status(404).json({ error: 'product not found' })

    const raw  = await redisClient.get(`cart:${req.params.sessionId}`)
    const cart = raw ? JSON.parse(raw) : []

    const existing = cart.find(i => i.id === product.id)
    if (existing) {
      existing.qty += 1
    } else {
      cart.push({ ...product, qty: 1 })
    }

    // TTL of 3600 seconds — cart expires after 1 hour of inactivity
    await redisClient.setEx(`cart:${req.params.sessionId}`, 3600, JSON.stringify(cart))
    res.json(cart)
  })

  app.delete('/cart/:sessionId', async (req, res) => {
    await redisClient.del(`cart:${req.params.sessionId}`)
    res.json({ cleared: true })
  })

  app.listen(PORT, () => console.log(`product-api listening on port ${PORT}`))
}

init().catch(err => { console.error('Startup error:', err); process.exit(1) })
