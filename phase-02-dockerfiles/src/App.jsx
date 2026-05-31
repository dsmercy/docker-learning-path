const products = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'Electronics' },
  { id: 2, name: 'Running Shoes',        price: 54.99, category: 'Footwear'    },
  { id: 3, name: 'Coffee Maker',         price: 39.99, category: 'Kitchen'     },
  { id: 4, name: 'Yoga Mat',             price: 24.99, category: 'Sports'      },
]

function ProductCard({ name, price, category }) {
  return (
    <div style={styles.card}>
      <span style={styles.category}>{category}</span>
      <h3 style={styles.name}>{name}</h3>
      <p style={styles.price}>${price.toFixed(2)}</p>
    </div>
  )
}

export default function App() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Phase 2 — E-commerce Storefront</h1>
        <p>Static product listing served by Nginx inside a Docker container</p>
      </header>
      <main style={styles.grid}>
        {products.map(p => <ProductCard key={p.id} {...p} />)}
      </main>
    </div>
  )
}

const styles = {
  page:     { fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 },
  header:   { marginBottom: 32, borderBottom: '2px solid #0ea5e9', paddingBottom: 16 },
  grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card:     { border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, background: '#f8fafc' },
  category: { fontSize: 11, textTransform: 'uppercase', color: '#64748b', letterSpacing: 1 },
  name:     { margin: '8px 0 4px', fontSize: 16 },
  price:    { fontWeight: 'bold', color: '#0ea5e9', fontSize: 18, margin: 0 },
}
