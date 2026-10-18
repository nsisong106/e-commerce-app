import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';

export default function Checkout() {
  const { user, token } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ street: '', city: '', state: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="empty">
        <h2>Log in to check out</h2>
        <p>You need an account to place an order.</p>
        <Link to="/login" className="btn">Log in</Link>
        <p className="switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn">Go shopping</Link>
      </div>
    );
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

 async function handleSubmit(e) {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    const order = await api('/orders', {
      method: 'POST',
      token,
      body: {
        items: items.map((i) => ({ product: i._id, quantity: i.quantity })),
        shippingAddress: form
      }
    });

    let destination = null;
    try {
      const pay = await api('/payments/initialize', {
        method: 'POST',
        token,
        body: { orderId: order._id }
      });
      destination = pay.authorization_url;
    } catch {
      // the order is saved, so the customer can pay from My orders
    }

    clearCart();
    if (destination) window.location.href = destination;
    else navigate('/orders');
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
}

  return (
    <>
      <h1 className="page-title">Checkout</h1>
      <div className="two-col">
        <form className="panel" onSubmit={handleSubmit}>
          <h2>Shipping details</h2>
          {error && <div className="error">{error}</div>}

          <div className="field">
            <label htmlFor="street">Street address</label>
            <input id="street" className="input" name="street" value={form.street} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" className="input" name="city" value={form.city} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="state">State</label>
            <input id="state" className="input" name="state" value={form.state} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" className="input" type="tel" name="phone" value={form.phone} onChange={handleChange} required />
          </div>

          <button className="btn btn-block" type="submit" disabled={loading}>
         {loading ? 'Please wait...' : 'Place order and pay'}
          </button>
        </form>

        <aside className="panel summary">
          <h2>Your order</h2>
          {items.map((i) => (
            <div key={i._id} className="summary-row">
              <span>{i.name} × {i.quantity}</span>
              <span>₦{(i.price * i.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </aside>
      </div>
    </>
  );
}