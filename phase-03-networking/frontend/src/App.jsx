import { useEffect, useState } from 'react'

// VITE_API_URL is injected at build time via --build-arg / ARG / ENV in the Dockerfile.
// At runtime the browser makes requests from the user's machine, so this must be
// a host-resolvable URL (localhost), NOT the container-internal DNS name.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function ProductCard({ name, price, category, stock }) {
  return (
    <div style={styles.card}>
      <span style={styles.category}>{category}</span>
      <h3 style={styles.name}>{name}</h3>
      <p style={styles.price}>${price.toFixed(2)}</p>
      <p style={styles.stock}>Stock: {stock}</p>
    </div>
  )
}

export default function App() {
  const [products, setProducts] = useState([])
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setProducts(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Phase 3 — Product Catalog</h1>
        <p>
          Frontend container fetches from API container via Docker bridge network.
          <br />
          <code>API: {API_URL}</code>
        </p>
      </header>

      {loading && <p>Loading products…</p>}
      {error   && <p style={styles.error}>Error fetching products: {error}</p>}

      <main style={styles.grid}>
        {products.map(p => <ProductCard key={p.id} {...p} />)}
      </main>
    </div>
  )
}

const styles = {
  page:     { fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto', padding: 24 },
  header:   { marginBottom: 32, borderBottom: '2px solid #0ea5e9', paddingBottom: 16 },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card:     { border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, background: '#f8fafc' },
  category: { fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: 1 },
  name:     { margin: '8px 0 4px', fontSize: 16 },
  price:    { fontWeight: 'bold', color: '#0ea5e9', fontSize: 18, margin: '0 0 4px' },
  stock:    { fontSize: 13, color: '#64748b', margin: 0 },
  error:    { color: '#dc2626', background: '#fef2f2', padding: 12, borderRadius: 6 },
}
