import { useEffect, useState } from 'react'

// All API calls go through the Nginx reverse proxy at /api/*
// The browser never talks directly to the API container.
const API = '/api'

const CATEGORIES = ['Electronics', 'Footwear', 'Kitchen', 'Sports', 'Home Office', 'Other']
const emptyForm  = { name: '', price: '', category: 'Electronics' }

export default function App() {
  const [products, setProducts] = useState([])
  const [form,     setForm]     = useState(emptyForm)
  const [editing,  setEditing]  = useState(null)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  const load = () =>
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(d => { setProducts(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault(); setError(null)
    const res = await fetch(editing ? `${API}/products/${editing}` : `${API}/products`, {
      method:  editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, price: Number(form.price) }),
    })
    if (!res.ok) { const b = await res.json(); setError(b.error); return }
    setForm(emptyForm); setEditing(null); load()
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1>Phase 9 — Nginx Reverse Proxy</h1>
        <p>All traffic enters via Nginx on port 80/443. The API container has no direct host port.</p>
        <p><small>API calls go to <code>/api/*</code> → Nginx → Express container</small></p>
      </header>
      {error && <p style={s.error}>{error}</p>}
      <section style={s.formCard}>
        <h2>{editing ? 'Edit' : 'Add'} Product</h2>
        <form onSubmit={submit} style={s.form}>
          <input style={s.input} placeholder="Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
          <input style={s.input} type="number" placeholder="Price" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} required />
          <select style={s.input} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button style={s.btn} type="submit">{editing ? 'Save' : 'Add'}</button>
          {editing && <button style={{...s.btn, background:'#64748b'}} type="button" onClick={() => { setEditing(null); setForm(emptyForm) }}>Cancel</button>}
        </form>
      </section>
      <section>
        <h2>Products ({products.length})</h2>
        {loading && <p>Loading…</p>}
        {products.length > 0 && (
          <table style={s.table}>
            <thead><tr><th style={s.th}>Name</th><th style={s.th}>Category</th><th style={s.th}>Price</th><th style={s.th}>Actions</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td style={s.td}>{p.name}</td>
                  <td style={s.td}>{p.category}</td>
                  <td style={s.td}>${p.price.toFixed(2)}</td>
                  <td style={s.td}>
                    <button style={s.btnEdit} onClick={() => { setEditing(p._id); setForm({ name: p.name, price: String(p.price), category: p.category }) }}>Edit</button>
                    <button style={s.btnDel} onClick={async () => { if(window.confirm('Delete?')) { await fetch(`${API}/products/${p._id}`, {method:'DELETE'}); load() } }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

const s = {
  page: { fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 },
  header: { marginBottom: 24, borderBottom: '2px solid #0f172a', paddingBottom: 12 },
  error: { color: '#dc2626', background: '#fef2f2', padding: 10, borderRadius: 6 },
  formCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 28 },
  form: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' },
  input: { padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, minWidth: 160 },
  btn: { background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '10px 12px', borderBottom: '1px solid #e2e8f0' },
  btnEdit: { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', marginRight: 6, fontSize: 13 },
  btnDel: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 13 },
}
