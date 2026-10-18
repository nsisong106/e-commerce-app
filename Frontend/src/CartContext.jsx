import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  function addToCart(product) {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, stock: product.stock, quantity: Math.min(i.quantity + 1, product.stock) }
            : i
        );
      }
      return [
        ...prev,
        { _id: product._id, name: product.name, price: product.price, stock: product.stock, quantity: 1 }
      ];
    });
  }

  function setQuantity(id, quantity) {
    setItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
      )
    );
  }

  function removeFromCart(id) {
    setItems((prev) => prev.filter((i) => i._id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, setQuantity, removeFromCart, clearCart, count, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);