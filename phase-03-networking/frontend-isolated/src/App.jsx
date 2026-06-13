import { useEffect, useState } from 'react'

// VITE_API_URL is baked in at build time. For the negative scenario this is set
// to http://product-api:3001 — a container-DNS name that the *browser* can never
// resolve, demonstrating what happens when the wrong URL type is used.
const API_URL = import.meta.env.VITE_API_URL || 'http://product-api:3001'

function NetworkDiagram() {
  return (
    <div style={styles.diagram}>
      <div style={styles.diagramTitle}>Network Isolation Diagram</div>
      <div style={styles.networks}>
        <div style={styles.network}>
          <div style={styles.networkLabel}>phase3-net</div>
          <div style={styles.container}>product-api<br /><span style={styles.port}>:3001</span></div>
          <div style={styles.container}>frontend<br /><span style={styles.port}>:3000</span></div>
        </div>
        <div style={styles.barrier}>✖ no route</div>
        <div style={styles.network}>
          <div style={styles.networkLabel}>phase3-isolated-net</div>
          <div style={{ ...styles.container, ...styles.containerIsolated }}>frontend-isolated<br /><span style={styles.port}>:3002 (you are here)</span></div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [products, setProducts] = useState([])
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [elapsed,  setElapsed]  = useState(null)

  useEffect(() => {
    const start = Date.now()
    fetch(`${API_URL}/products`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setProducts(data); setLoading(false); setElapsed(Date.now() - start) })
      .catch(err => { setError(err.message); setLoading(false); setElapsed(Date.now() - start) })
  }, [])

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.badge}>NEGATIVE SCENARIO — Network Isolation</div>
        <h1>Phase 3 — Isolated Frontend</h1>
        <p>
          This container runs on <strong>phase3-isolated-net</strong>, a separate network
          from the API. The fetch below will fail because:
        </p>
        <ul style={styles.list}>
          <li>Container-to-container DNS (<code>product-api:3001</code>) only works on the <em>same</em> custom network.</li>
          <li>This container is on <strong>phase3-isolated-net</strong>; the API is on <strong>phase3-net</strong>.</li>
          <li>There is no route between the two networks.</li>
          <li>Additionally, the browser cannot resolve Docker container DNS names at all — it always needs a host port.</li>
        </ul>
        <p>
          <code>VITE_API_URL baked in: {API_URL}</code>
        </p>
      </header>

      <NetworkDiagram />

      <section style={styles.result}>
        <h2>Fetch attempt result</h2>
        {loading && <p style={styles.loading}>Attempting to fetch from <code>{API_URL}/products</code>…</p>}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorTitle}>Fetch failed (expected)</p>
            <p><strong>Error:</strong> {error}</p>
            <p><strong>Time before failure:</strong> {elapsed}ms</p>
            <p><strong>Target URL:</strong> <code>{API_URL}/products</code></p>
            <p style={styles.explanation}>
              The browser tried to resolve <code>product-api</code> as a hostname. It is not
              in the host's DNS — Docker container names are invisible outside the Docker
              network. Even if this container were on <code>phase3-net</code>, the browser
              still could not resolve container DNS names. This is the double isolation at play.
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div style={styles.unexpectedSuccess}>
            Unexpected: fetch succeeded ({products.length} products). Check that the container
            is truly on an isolated network and that VITE_API_URL is not pointing to localhost.
          </div>
        )}
      </section>

      <section style={styles.fix}>
        <h2>How to fix (for reference)</h2>
        <ol style={styles.list}>
          <li>Put both containers on the same custom network: <code>--network phase3-net</code></li>
          <li>Use a <strong>host port</strong> in VITE_API_URL, not a container DNS name:<br />
            <code>--build-arg VITE_API_URL=http://localhost:3001</code>
          </li>
        </ol>
      </section>
    </div>
  )
}

const styles = {
  page:       { fontFamily: 'sans-serif', maxWidth: 860, margin: '0 auto', padding: 24 },
  header:     { marginBottom: 24, borderBottom: '3px solid #dc2626', paddingBottom: 16 },
  badge:      { display: 'inline-block', background: '#dc2626', color: '#fff', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  list:       { lineHeight: 1.8 },
  diagram:    { background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: 20, marginBottom: 24 },
  diagramTitle: { fontWeight: 'bold', marginBottom: 12, fontSize: 14, color: '#475569' },
  networks:   { display: 'flex', alignItems: 'center', gap: 16 },
  network:    { flex: 1, border: '2px solid #94a3b8', borderRadius: 8, padding: 12, background: '#fff' },
  networkLabel: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', marginBottom: 8, letterSpacing: 1 },
  container:  { background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 6, padding: '8px 12px', marginBottom: 6, fontSize: 13 },
  containerIsolated: { background: '#fee2e2', border: '1px solid #fca5a5' },
  port:       { fontSize: 11, color: '#64748b' },
  barrier:    { fontSize: 22, color: '#dc2626', fontWeight: 'bold', flexShrink: 0 },
  result:     { marginBottom: 24 },
  loading:    { color: '#64748b' },
  errorBox:   { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16 },
  errorTitle: { color: '#dc2626', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  explanation: { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: 10, marginTop: 10, fontSize: 14, color: '#92400e' },
  unexpectedSuccess: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: 16, color: '#713f12' },
  fix:        { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 16 },
}
