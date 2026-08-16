import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Checkout() {
  const { isVendor } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (isVendor) {
    return <Navigate to="/dashboard/vendor" replace />;
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const itemsData = cartItems.map(item => ({ product_id: item.id, quantity: item.quantity, selected_options: item.selected_options || {} }));
      await api.post('/orders/', { items: itemsData });
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error(error);
      let errMsg = 'Checkout failed.';
      if (error.response?.data?.items) {
        errMsg = Array.isArray(error.response.data.items) ? error.response.data.items[0] : error.response.data.items;
      }
      alert(errMsg);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow transition-colors">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Checkout</h2>
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white">
        <p className="font-bold text-lg">Total to Pay: ${cartTotal.toFixed(2)}</p>
      </div>
      <form onSubmit={handleCheckout}>
        <div className="space-y-4 mb-6">
          <input type="text" placeholder="Full Name" className="w-full border rounded p-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 transition-colors" required />
          <input type="text" placeholder="Address" className="w-full border rounded p-2 bg-white text-gray-900 border-gray-300 placeholder-gray-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 transition-colors" required />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded font-medium hover:bg-indigo-700">Place Order</button>
      </form>
    </div>
  );
}
