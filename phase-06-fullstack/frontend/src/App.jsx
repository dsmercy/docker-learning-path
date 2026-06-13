import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const CATEGORIES = ['Electronics', 'Footwear', 'Kitchen', 'Sports', 'Home Office', 'Other']

const emptyForm = { name: '', price: '', category: 'Electronics' }

export default function App() {
  const [products, setProducts] = useState([])
  const [form,     setForm]     = useState(emptyForm)
  const [editing,  setEditing]  = useState(null)   // product id being edited
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  const loadProducts = () =>
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })

  useEffect(() => { loadProducts() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const method = editing ? 'PUT' : 'POST'
    const url    = editing ? `${API_URL}/products/${editing}` : `${API_URL}/products`
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Request failed')
      return
    }
    setForm(emptyForm)
    setEditing(null)
    loadProducts()
  }

  const startEdit = (product) => {
    setEditing(product.id)
    setForm({ name: product.name, price: String(product.price), category: product.category })
  }

  const cancelEdit = () => { setEditing(null); setForm(emptyForm) }

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return
    await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
    loadProducts()
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1>Phase 6 — Product Management</h1>
        <p>Two-service stack: <code>frontend</code> · <code>api</code> (in-memory store)</p>
        <p><small>API: {API_URL}</small></p>
      </header>

      {error && <p style={s.error}>Error: {error}</p>}

      {/* ── Form ── */}
      <section style={s.formCard}>
        <h2>{editing ? `Edit Product #${editing}` : 'Add Product'}</h2>
        <form onSubmit={handleSubmit} style={s.form}>
          <input
            style={s.input}
            placeholder="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            style={s.input}
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            required
          />
          <select
            style={s.input}
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={s.formBtns}>
            <button style={s.btnPrimary} type="submit">
              {editing ? 'Save Changes' : 'Add Product'}
            </button>
            {editing && (
              <button style={s.btnSecondary} type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── Table ── */}
      <section>
        <h2>Products ({products.length})</h2>
        {loading && <p>Loading…</p>}
        {!loading && products.length === 0 && <p style={{ color: '#64748b' }}>No products yet.</p>}
        {products.length > 0 && (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID</th>
                <th style={s.th}>Name</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Price</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={editing === p.id ? s.rowHighlight : undefined}>
                  <td style={s.td}>{p.id}</td>
                  <td style={s.td}>{p.name}</td>
                  <td style={s.td}><span style={s.badge}>{p.category}</span></td>
                  <td style={s.td}>${p.price.toFixed(2)}</td>
                  <td style={s.td}>
                    <button style={s.btnEdit} onClick={() => startEdit(p)}>Edit</button>
                    <button style={s.btnDelete} onClick={() => deleteProduct(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={s.note}>
          ⚠ Data lives in-memory — restart the API container and products reset to defaults.
          Phase 7 adds MongoDB for persistence.
        </p>
      </section>
    </div>
  )
}

const s = {
  page:         { fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 },
  header:       { marginBottom: 24, borderBottom: '2px solid #0ea5e9', paddingBottom: 12 },
  error:        { color: '#dc2626', background: '#fef2f2', padding: 10, borderRadius: 6 },
  formCard:     { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 28 },
  form:         { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' },
  input:        { padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, minWidth: 160 },
  formBtns:     { display: 'flex', gap: 8 },
  btnPrimary:   { background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  btnSecondary: { background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:           { textAlign: 'left', padding: '10px 12px', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  td:           { padding: '10px 12px', borderBottom: '1px solid #e2e8f0' },
  rowHighlight: { background: '#fffbeb' },
  badge:        { background: '#e0f2fe', color: '#0369a1', borderRadius: 4, padding: '2px 7px', fontSize: 12 },
  btnEdit:      { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', marginRight: 6, fontSize: 13 },
  btnDelete:    { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 13 },
  note:         { color: '#64748b', fontSize: 12, marginTop: 14 },
}
