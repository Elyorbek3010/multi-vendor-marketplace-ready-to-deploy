import { useState, useEffect } from 'react';
import api from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const { notifications } = useWebSocket();

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    api.get('/orders/')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : (res.data?.results || [])))
      .catch(err => { console.error(err); setOrders([]); });
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const last = notifications[0];
      if (last.type === 'ORDER_STATUS_UPDATED' || last.type === 'ORDER_CREATED') {
        setOrders(prev => prev.map(o => o.id.toString() === last.data.order_id ? { ...o, status: last.data.status } : o));
        
        // Trigger the interactive toast!
        setToastMessage(`Order #${last.data.order_id.substring(0,8)} is now ${last.data.status}`);
        
        // Auto-hide the toast after 5 seconds
        setTimeout(() => setToastMessage(null), 5000);
      }
    }
  }, [notifications]);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Order History</h2>
      <div className="space-y-4">
        {(!Array.isArray(orders) || orders.length === 0) ? <p className="text-gray-900 dark:text-white">No orders found.</p> : orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm mb-4 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700 gap-4 sm:gap-0">
              <div>
                <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Order #{order.id.substring(0,8)}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-2 inline-block">{order.status}</span>
                <p className="font-bold text-gray-900 dark:text-white mt-1">Total: ${order.total_amount}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-600">
                    {item.product_image ? (
                      <img 
                        src={getImageUrl(item.product_image)} 
                        alt={item.product_title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150?text=No+Image'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">IMG</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-200">{item.product_title || `Product ${item.product_id?.substring(0,8) || ''}`}</h4>
                    
                    {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 mb-1">
                        {Object.entries(item.selected_options).map(([k, v]) => (
                          <span key={k} className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right font-medium text-gray-900 dark:text-gray-300">
                    ${item.price_at_purchase}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 transform transition-all duration-500 ease-in-out translate-y-0 opacity-100">
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">Order Status Update</p>
              <p className="text-sm text-indigo-100">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="ml-4 text-white/70 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
