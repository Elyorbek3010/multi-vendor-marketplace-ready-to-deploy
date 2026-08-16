import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setCartTotal(0);
      return;
    }
    try {
      const response = await api.get('/orders/cart/');
      const items = response.data.items.map(item => ({
        id: item.product_id,
        cart_item_id: item.id,
        title: item.product_title,
        image: item.product_image,
        price: item.price,
        quantity: item.quantity,
        stock: item.stock,
        selected_options: item.selected_options || {}
      }));
      setCartItems(items);
      setCartTotal(response.data.total_amount);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product, quantity = 1, selectedOptions = {}) => {
    if (!user) {
      alert("Please log in to add items to your cart!");
      return;
    }
    try {
      await api.post('/orders/cart/items/', {
        product_id: product.id,
        quantity: quantity,
        selected_options: selectedOptions
      });
      fetchCart();
    } catch (err) {
      console.error("Add to cart failed:", err);
      if (err.response?.data?.error) alert(err.response.data.error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) return;
    try {
      await api.delete(`/orders/cart/items/${productId}/`);
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user) return;
    if (quantity < 1) return removeFromCart(productId);
    try {
      await api.put(`/orders/cart/items/${productId}/`, { quantity });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setCartTotal(0);
    // Backend cart is automatically cleared on checkout success.
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
