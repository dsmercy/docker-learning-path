const express = require('express')
const fs      = require('fs')
const path    = require('path')

const app       = express()
const PORT      = 3001
// DATA_DIR is injected via ENV in the Dockerfile; defaults to /data for local runs
const DATA_DIR  = process.env.DATA_DIR || '/data'
const DATA_FILE = path.join(DATA_DIR, 'wishlist.json')

app.use(express.json())
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); next() })

function readWishlist() {
  if (!fs.existsSync(DATA_FILE)) return []
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

function writeWishlist(items) {
  // Ensure the data directory exists (volume may be freshly created)
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2))
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'wishlist-api', dataFile: DATA_FILE })
})

app.get('/wishlist', (_req, res) => {
  res.json(readWishlist())
})

app.post('/wishlist', (req, res) => {
  const { name, price } = req.body
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price are required' })
  }
  const items = readWishlist()
  const item  = { id: Date.now(), name, price: Number(price), addedAt: new Date().toISOString() }
  items.push(item)
  writeWishlist(items)
  res.status(201).json(item)
})

app.delete('/wishlist/:id', (req, res) => {
  const id    = Number(req.params.id)
  const items = readWishlist().filter(i => i.id !== id)
  writeWishlist(items)
  res.json({ deleted: id })
})

app.listen(PORT, () => {
  console.log(`wishlist-api listening on port ${PORT}`)
  console.log(`data file: ${DATA_FILE}`)
})
