const express    = require('express')
const cors       = require('cors')
const mongoose   = require('mongoose')
const promClient = require('prom-client')
const winston    = require('winston')
const LokiTransport = require('winston-loki')

const app  = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/products'
const LOKI_URL    = process.env.LOKI_URL    || 'http://loki:3100'

// ── Structured logger → Loki ──────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'product-api' },
  transports: [
    new winston.transports.Console(),
    new LokiTransport({
      host: LOKI_URL,
      labels: { job: 'product-api' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error('Loki connection error:', err),
    }),
  ],
})

// ── Prometheus metrics ────────────────────────────────────────────────────────
promClient.collectDefaultMetrics({ prefix: 'api_' })

const httpRequestsTotal = new promClient.Counter({
  name: 'api_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

const httpDurationSeconds = new promClient.Histogram({
  name: 'api_http_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
})

// ── Express setup ─────────────────────────────────────────────────────────────
app.use(express.json())
app.use(cors())

// Middleware: record metrics and log every request
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route    = req.route?.path || req.path
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode })
    httpDurationSeconds.observe({ method: req.method, route }, duration)
    logger.info('http request', {
      method: req.method, path: req.path, status: res.statusCode, duration,
    })
  })
  next()
})

// ── Schema ────────────────────────────────────────────────────────────────────
const Product = mongoose.model('Product', new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  price:    { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
}, { timestamps: true }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const ok = mongoose.connection.readyState === 1
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', service: 'product-api' })
})

// Prometheus scrape endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(await promClient.register.metrics())
})

app.get('/products', async (_req, res) => {
  res.json(await Product.find().sort({ createdAt: 1 }))
})

app.post('/products', async (req, res) => {
  const p = await Product.create({ ...req.body, price: Number(req.body.price) })
  logger.info('product created', { id: p._id, name: p.name })
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
  logger.info('product deleted', { id: req.params.id })
  res.status(204).end()
})

app.use((err, _req, res, _next) => {
  logger.error('unhandled error', { error: err.message })
  res.status(500).json({ error: err.message })
})

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await mongoose.connect(MONGODB_URI)
  logger.info('MongoDB connected')
  app.listen(PORT, () => logger.info(`product-api listening on port ${PORT}`))
}

start().catch(err => { logger.error('Startup error', { error: err.message }); process.exit(1) })
