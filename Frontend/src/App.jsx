import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Admin from './pages/Admin';

const STORE_NAME = "Nsisong's"; // change this to your store's name

function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">{STORE_NAME}</Link>
        <nav className="nav-links">
          <Link to="/">Shop</Link>
          <Link to="/cart">
            Cart{count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <>
            {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              <Link to="/orders">My orders</Link>
              <span className="hello">Hi, {user.name}</span>
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Products />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
            <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
