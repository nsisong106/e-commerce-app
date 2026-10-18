import { useEffect, useState } from 'react';
import { api } from '../api';
import { useCart } from '../CartContext';

export default function Products() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(null);

  useEffect(() => {
    setLoading(true);
    api(`/products?search=${encodeURIComponent(search)}`)
      .then((data) => {
        setProducts(data.products);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search]);

  function handleAdd(product) {
    addToCart(product);
    setAdded(product._id);
    setTimeout(() => setAdded(null), 1200);
  }

  return (
    <>
      <section className="hero">
        <h1>Find something you'll love</h1>
        <p>Quality products, delivered to your door.</p>
        <input
          className="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty">
          <h2>No products found</h2>
          <p>Try a different search.</p>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <article key={p._id} className="card">
              <div className="thumb">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} />
                ) : (
                  <span>{p.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="card-body">
                <span className="category">{p.category}</span>
                <h3>{p.name}</h3>
                <p className="desc">{p.description}</p>
                <div className="card-foot">
                  <div>
                    <div className="price">₦{p.price.toLocaleString()}</div>
                    <div className={p.stock > 0 ? 'stock' : 'stock out'}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </div>
                  </div>
                  <button className="btn" disabled={p.stock === 0} onClick={() => handleAdd(p)}>
                    {added === p._id ? 'Added ✓' : 'Add to cart'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}