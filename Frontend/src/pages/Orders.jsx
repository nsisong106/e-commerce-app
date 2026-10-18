import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api('/orders/mine', { token })
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handlePay(orderId) {
    setError('');
    setPayingId(orderId);
    try {
      const data = await api('/payments/initialize', {
        method: 'POST',
        token,
        body: { orderId }
      });
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message);
      setPayingId(null);
    }
  }

  if (!token) {
    return (
      <div className="empty">
        <h2>Log in to see your orders</h2>
        <Link to="/login" className="btn">Log in</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">My orders</h1>
      {loading && <p className="muted">Loading...</p>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty">
          <h2>No orders yet</h2>
          <p>When you place an order, it will show up here.</p>
          <Link to="/" className="btn">Start shopping</Link>
        </div>
      )}

      {orders.map((o) => (
        <div key={o._id} className="panel order-card">
          <div className="order-head">
            <strong>Order #{o._id.slice(-6).toUpperCase()}</strong>
            <span className="muted">{new Date(o.createdAt).toLocaleDateString()}</span>
          </div>

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

          {o.paymentStatus !== 'paid' && o.orderStatus !== 'cancelled' && (
            <div style={{ marginTop: 12 }}>
              <button className="btn" disabled={payingId === o._id} onClick={() => handlePay(o._id)}>
                {payingId === o._id ? 'Redirecting...' : 'Pay now'}
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}