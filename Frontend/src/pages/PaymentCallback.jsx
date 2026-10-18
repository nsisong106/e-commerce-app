import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function PaymentCallback() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const reference = params.get('reference');
  const [result, setResult] = useState({ status: 'checking', message: '' });

  useEffect(() => {
    if (!reference || !token) return;
    api('/payments/verify', { method: 'POST', token, body: { reference } })
      .then((order) =>
        setResult({ status: order.paymentStatus === 'paid' ? 'paid' : 'unpaid', message: '' })
      )
      .catch((err) => setResult({ status: 'error', message: err.message }));
  }, [reference, token]);

  if (!reference) {
    return (
      <div className="empty">
        <h2>No payment found</h2>
        <Link to="/orders" className="btn">Go to my orders</Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="empty">
        <h2>Please log in</h2>
        <p>Log in to confirm your payment.</p>
        <Link to="/login" className="btn">Log in</Link>
      </div>
    );
  }

  return (
    <div className="empty">
      {result.status === 'checking' && (
        <>
          <h2>Confirming your payment...</h2>
          <p>Please don't close this page.</p>
        </>
      )}
      {result.status === 'paid' && (
        <>
          <h2>Payment successful</h2>
          <p>Thank you! Your order is confirmed.</p>
          <Link to="/orders" className="btn">View my orders</Link>
        </>
      )}
      {result.status === 'unpaid' && (
        <>
          <h2>Payment not completed</h2>
          <p>Your order is saved. You can try again from My orders.</p>
          <Link to="/orders" className="btn">Go to my orders</Link>
        </>
      )}
      {result.status === 'error' && (
        <>
          <h2>We couldn't confirm your payment</h2>
          <div className="error">{result.message}</div>
          <p>If money left your account, contact us with your order number.</p>
          <Link to="/orders" className="btn">Go to my orders</Link>
        </>
      )}
    </div>
  );
}