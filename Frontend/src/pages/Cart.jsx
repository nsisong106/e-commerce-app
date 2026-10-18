import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';

export default function Cart() {
  const { items, setQuantity, removeFromCart, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn">Continue shopping</Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Your cart</h1>
      <div className="two-col">
        <div className="panel">
          {items.map((i) => (
            <div key={i._id} className="cart-row">
              <div className="cart-thumb">{i.name.charAt(0).toUpperCase()}</div>
              <div className="cart-info">
                <strong>{i.name}</strong>
                <span className="muted">₦{i.price.toLocaleString()} each</span>
              </div>
              <input
                className="input qty"
                type="number"
                min="1"
                max={i.stock}
                value={i.quantity}
                onChange={(e) => setQuantity(i._id, Number(e.target.value) || 1)}
              />
              <div className="cart-line">₦{(i.price * i.quantity).toLocaleString()}</div>
              <button className="btn-link" onClick={() => removeFromCart(i._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="panel summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{count}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
          <Link to="/checkout" className="btn btn-block">Proceed to checkout</Link>
        </aside>
      </div>
    </>
  );
}