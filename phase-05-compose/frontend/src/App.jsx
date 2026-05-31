import { useEffect, useState } from 'react'

const API_URL   = import.meta.env.VITE_API_URL  || 'http://localhost:3001'
// A fixed session ID so the cart persists across page refreshes in this demo
const SESSION   = 'demo-session-1'

function ProductCard({ product, onAddToCart }) {
  return (
    <div style={styles.card}>
      <span style={styles.category}>{product.category}</span>
      <h3 style={styles.name}>{product.name}</h3>
      <p style={styles.price}>${product.price.toFixed(2)}</p>
      <button style={styles.btn} onClick={() => onAddToCart(product.id)}>
        Add to cart
      </button>
    </div>
  )
}

function CartItem({ item }) {
  return (
    <li style={styles.cartItem}>
      <span>{item.name}</span>
      <span style={styles.qty}>×{item.qty}</span>
      <span style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</span>
    </li>
  )
}

export default function App() {
  const [products, setProducts] = useState([])
  const [cart,     setCart]     = useState([])
  const [error,    setError]    = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(setProducts)
      .catch(e => setError(e.message))

    fetch(`${API_URL}/cart/${SESSION}`)
      .then(r => r.json())
      .then(setCart)
      .catch(e => setError(e.message))
  }, [])

  const addToCart = async (productId) => {
    const res  = await fetch(`${API_URL}/cart/${SESSION}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ productId }),
    })
    const updated = await res.json()
    setCart(updated)
  }

  const clearCart = async () => {
    await fetch(`${API_URL}/cart/${SESSION}`, { method: 'DELETE' })
    setCart([])
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Phase 5 — Mini E-commerce</h1>
        <p>Three services via Docker Compose: <code>frontend</code> · <code>api</code> · <code>redis</code></p>
        <p><small>API: {API_URL} | Session: {SESSION}</small></p>
      </header>

      {error && <p style={styles.error}>Error: {error}</p>}

      <div style={styles.layout}>
        <section>
          <h2>Products</h2>
          <div style={styles.grid}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        </section>

        <aside style={styles.cartPanel}>
          <h2>Cart ({cart.reduce((n, i) => n + i.qty, 0)} items)</h2>
          {cart.length === 0
            ? <p style={{ color: '#94a3b8' }}>Empty</p>
            : <>
                <ul style={styles.cartList}>
                  {cart.map(i => <CartItem key={i.id} item={i} />)}
                </ul>
                <p style={styles.total}>Total: <strong>${total.toFixed(2)}</strong></p>
                <button style={{ ...styles.btn, background: '#dc2626' }} onClick={clearCart}>
                  Clear cart
                </button>
              </>
          }
          <p style={styles.redisNote}>
            Cart is stored in Redis. Restart the API container — cart survives. ✅
          </p>
        </aside>
      </div>
    </div>
  )
}

const styles = {
  page:      { fontFamily: 'sans-serif', maxWidth: 1100, margin: '0 auto', padding: 24 },
  header:    { marginBottom: 24, borderBottom: '2px solid #0ea5e9', paddingBottom: 12 },
  layout:    { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  card:      { border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' },
  category:  { fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: 1 },
  name:      { margin: '6px 0 4px', fontSize: 15 },
  price:     { fontWeight: 'bold', color: '#0ea5e9', fontSize: 17, margin: '0 0 8px' },
  btn:       { background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  cartPanel: { background: '#f1f5f9', borderRadius: 10, padding: 16, alignSelf: 'start' },
  cartList:  { listStyle: 'none', padding: 0, margin: '0 0 8px' },
  cartItem:  { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 },
  qty:       { color: '#64748b', minWidth: 30, textAlign: 'center' },
  itemPrice: { fontWeight: 'bold', minWidth: 55, textAlign: 'right' },
  total:     { borderTop: '1px solid #cbd5e1', paddingTop: 8, marginBottom: 8 },
  redisNote: { fontSize: 11, color: '#64748b', marginTop: 12 },
  error:     { color: '#dc2626', background: '#fef2f2', padding: 10, borderRadius: 6 },
}
