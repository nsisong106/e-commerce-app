import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, uploadImage } from '../api';
import { useAuth } from '../AuthContext';

const EMPTY_FORM = { name: '', description: '', price: '', category: '', stock: '', image: '' };

function AdminProducts({ token }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await api('/products?limit=50');
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startEdit(p) {
    setEditingId(p._id);
    setMessage('');
    setError('');
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      category: p.category || '',
      stock: String(p.stock),
      image: p.images?.[0] || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }


  async function handleImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  setError('');
  setUploading(true);
  try {
    const url = await uploadImage(file, token);
    setForm((prev) => ({ ...prev, image: url }));
  } catch (err) {
    setError(err.message);
  } finally {
    setUploading(false);
    e.target.value = '';
  }
}

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category || 'general',
      stock: Number(form.stock) || 0,
      images: form.image ? [form.image] : []
    };

    try {
      if (editingId) {
        await api(`/products/${editingId}`, { method: 'PUT', token, body });
        setMessage('Product updated');
      } else {
        await api('/products', { method: 'POST', token, body });
        setMessage('Product added');
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/products/${p._id}`, { method: 'DELETE', token });
      setMessage('Product deleted');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <form className="panel" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <h2>{editingId ? 'Edit product' : 'Add a product'}</h2>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" className="input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" className="input" name="category" placeholder="e.g. shoes" value={form.category} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="price">Price (₦)</label>
            <input id="price" className="input" type="number" min="0" name="price" value={form.price} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="stock">Stock</label>
            <input id="stock" className="input" type="number" min="0" name="stock" value={form.stock} onChange={handleChange} required />
          </div>
          <div className="field full">
  <label htmlFor="image-file">Product image</label>
  <input
    id="image-file"
    className="input"
    type="file"
    accept="image/*"
    onChange={handleImage}
    disabled={uploading}
  />
  {uploading && <span className="muted">Uploading...</span>}
  {form.image && (
    <div className="image-preview">
      <img src={form.image} alt="Preview" />
      <button type="button" className="btn-link" onClick={() => setForm({ ...form, image: '' })}>
        Remove image
      </button>
    </div>
  )}
</div>
          <div className="field full">
            <label htmlFor="description">Description</label>
            <textarea id="description" className="input" rows="3" name="description" value={form.description} onChange={handleChange} />
          </div>
        </div>

        <div className="actions">
          <button className="btn" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="panel">
        <h2>All products ({products.length})</h2>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : products.length === 0 ? (
          <p className="muted">No products yet. Add your first one above.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="table-name">
                        {p.images?.[0] ? (
                          <img className="thumb-sm" src={p.images[0]} alt="" />
                        ) : (
                          <div className="thumb-sm">{p.name.charAt(0).toUpperCase()}</div>
                        )}
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>₦{p.price.toLocaleString()}</td>
                    <td>{p.stock}</td>
                    <td>
                      <div className="actions" style={{ margin: 0 }}>
                        <button className="btn btn-ghost btn-small" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button className="btn-link" onClick={() => handleDelete(p)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function AdminOrders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/orders', { token })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function update(id, changes) {
    setError('');
    if (changes.orderStatus === 'cancelled' && !window.confirm('Cancel this order? The stock will be returned.')) {
      return;
    }
    try {
      const updated = await api(`/orders/${id}/status`, { method: 'PUT', token, body: changes });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id
            ? { ...o, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus }
            : o
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <>
      {error && <div className="error">{error}</div>}
      {orders.length === 0 && (
        <div className="empty">
          <h2>No orders yet</h2>
          <p>Orders from customers will show up here.</p>
        </div>
      )}

      {orders.map((o) => (
        <div key={o._id} className="panel order-card">
          <div className="order-head">
            <strong>Order #{o._id.slice(-6).toUpperCase()}</strong>
            <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
          </div>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            {o.user ? `${o.user.name} (${o.user.email})` : 'Deleted user'} · {o.shippingAddress?.street},{' '}
            {o.shippingAddress?.city} · {o.shippingAddress?.phone}
          </p>

          {o.items.map((i, idx) => (
            <div key={idx} className="order-item">
              <span>{i.name} × {i.quantity}</span>
              <span>₦{(i.price * i.quantity).toLocaleString()}</span>
            </div>
          ))}

          <div className="order-foot">
            <strong>Total: ₦{o.total.toLocaleString()}</strong>
            <span>
              <span className={`pill pill-${o.orderStatus}`}>{o.orderStatus}</span>
              <span className={`pill pill-${o.paymentStatus}`}>{o.paymentStatus}</span>
            </span>
          </div>

          <div className="status-row">
            <label>
              Order status
              <select
                className="input"
                value={o.orderStatus}
                disabled={o.orderStatus === 'cancelled'}
                onChange={(e) => update(o._id, { orderStatus: e.target.value })}
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Payment
              <select
                className="input"
                value={o.paymentStatus}
                onChange={(e) => update(o._id, { paymentStatus: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>
        </div>
      ))}
    </>
  );
}

export default function Admin() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState('products');

  if (!user || user.role !== 'admin') {
    return (
      <div className="empty">
        <h2>Admins only</h2>
        <p>Log in with an admin account to see this page.</p>
        <Link to="/login" className="btn">Log in</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Admin dashboard</h1>
      <div className="tabs">
        <button className={tab === 'products' ? 'tab active' : 'tab'} onClick={() => setTab('products')}>
          Products
        </button>
        <button className={tab === 'orders' ? 'tab active' : 'tab'} onClick={() => setTab('orders')}>
          Orders
        </button>
      </div>

      {tab === 'products' ? <AdminProducts token={token} /> : <AdminOrders token={token} />}
    </>
  );
}