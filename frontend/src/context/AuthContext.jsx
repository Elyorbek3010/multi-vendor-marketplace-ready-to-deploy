import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/auth/me/');
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    };
    verifySession();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    const userRes = await api.get('/auth/me/');
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  };

  const logout = () => {
    if (user && user.id) {
      localStorage.removeItem(`cart_${user.id}`);
    }
    localStorage.removeItem('cart_guest');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const isVendor = user?.role === 'VENDOR';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, isVendor }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
