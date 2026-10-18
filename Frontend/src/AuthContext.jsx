import { createContext, useContext, useState } from 'react';
import { api } from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('auth')) || null;
    } catch {
      return null;
    }
  });

  function save(data) {
    setAuth(data);
    if (data) localStorage.setItem('auth', JSON.stringify(data));
    else localStorage.removeItem('auth');
  }

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    save(data);
  }

  async function register(name, email, password) {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    save(data);
  }

  function logout() {
    save(null);
  }

  return (
    <AuthContext.Provider value={{ user: auth?.user, token: auth?.token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);