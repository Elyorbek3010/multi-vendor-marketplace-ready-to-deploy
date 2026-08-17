import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, ShoppingCart, DollarSign, Plus, Edit, Trash2, X, Image as ImageIcon, Search } from 'lucide-react';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', stock: 0, category: '', optionsStr: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    api.get('/products/items/')
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        // In a real app we'd filter by vendor ID via API query params. For now, filter locally if vendor_id is available.
        const vendorProducts = user?.vendor_id ? items.filter(p => p.vendor === user.vendor_id) : items;
        setProducts(vendorProducts);
      })
      .catch(err => { console.error(err); setProducts([]); });
    
    api.get('/orders/')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : (res.data?.results || [])))
      .catch(err => { console.error(err); setOrders([]); });

    api.get('/products/categories/')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data?.results || [])))
      .catch(console.error);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status/`, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNewClick = () => {
    setEditingProductId(null);
    setFormData({ title: '', description: '', price: '', stock: 0, category: '', optionsStr: '' });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    let optionsStr = '';
    if (product.options && Object.keys(product.options).length > 0) {
      optionsStr = Object.entries(product.options).map(([k, v]) => `${k}: ${v.join(', ')}`).join('\n');
    }
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock !== undefined ? product.stock : (product.inventory?.stock || 0),
      category: product.category || '',
      optionsStr
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/items/${productId}/`);
        setProducts(products.filter(p => p.id !== productId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('price', formData.price);
      form.append('stock', formData.stock);
      if (formData.category) {
        form.append('category', formData.category);
      }
      
      let optionsJson = {};
      if (formData.optionsStr) {
        formData.optionsStr.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length === 2) {
            const key = parts[0].trim();
            const values = parts[1].split(',').map(v => v.trim()).filter(v => v);
            if (key && values.length) {
              optionsJson[key] = values;
            }
          }
        });
      }
      form.append('options', JSON.stringify(optionsJson));
      if (selectedFile) {
        form.append('image', selectedFile);
      }

      if (editingProductId) {
        await api.patch(`/products/items/${editingProductId}/`, form);
      } else {
        await api.post('/products/items/', form);
      }
      
      setIsModalOpen(false);
      fetchData();
      setEditingProductId(null);
      setFormData({ title: '', description: '', price: '', stock: 0, category: '', optionsStr: '' });
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const revenue = (orders || []).reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0).toFixed(2);
  const activeOrders = (orders || []).filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;

  const filteredProducts = (products || []).filter(p => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const titleMatch = p.title?.toLowerCase().includes(term);
    const categoryMatch = categories.find(c => c.id === p.category)?.name?.toLowerCase().includes(term);
    return titleMatch || categoryMatch;
  });

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.store_name || user?.username || 'Vendor'} Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your products and orders</p>
        </div>
        <button 
          onClick={handleAddNewClick}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Product
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mr-4">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Total Products</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{(products || []).length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full mr-4">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Active Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeOrders}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700 flex items-center transition-colors">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mr-4">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${revenue}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-12" id="products">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">My Products</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search title or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
            />
          </div>
        </div>
        
        {(!Array.isArray(filteredProducts) || filteredProducts.length === 0) ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-100 dark:border-gray-700 transition-colors">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No products yet</h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by adding your first product to the marketplace.</p>
            <button 
              onClick={handleAddNewClick}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Product
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0].image || p.images[0].image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">${p.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        {p.stock || 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {p.category ? categories.find(c => c.id === p.category)?.name || 'Category' : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEditClick(p)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"><Edit className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Incoming Orders</h3>
        {(!Array.isArray(orders) || orders.length === 0) ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-100 dark:border-gray-700 transition-colors">
            <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No incoming orders yet</h4>
            <p className="text-gray-500 dark:text-gray-400">When customers buy your products, they will appear here.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      <div className="mb-1">#{o.id.substring(0, 8)}...</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(o.created_at).toLocaleString()}</div>
                      {o.items && o.items.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                {item.product_image ? (
                                  <img 
                                    src={getImageUrl(item.product_image)} 
                                    alt={item.product_title} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }} 
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 m-2 text-gray-400" />
                                )}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]" title={item.product_title}>
                                {item.product_title} <span className="font-bold text-gray-900 dark:text-gray-200 ml-1">× {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${o.total_amount || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.status === 'DELIVERED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : o.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' : 'bg-yellow-100 dark:bg-amber-900/40 text-yellow-800 dark:text-amber-300'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                      <select 
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white w-full max-w-md max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Price ($)</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Count</label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Category</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors">
                  <option value="">Select a category</option>
                  {(categories || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Product Variants (Optional)</label>
                <textarea value={formData.optionsStr} onChange={e => setFormData({...formData, optionsStr: e.target.value})} rows="2" placeholder="e.g. Size: S, M, L&#10;Color: Red, Blue" className="mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-colors"></textarea>
                <p className="text-xs text-gray-500 mt-1">Format: "Name: Value1, Value2" on separate lines.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30 transition-colors">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400 mt-2 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition-colors">
                        <span>{selectedFile ? selectedFile.name : "Upload a file"}</span>
                        <input id="file-upload" name="file-upload" type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} className="sr-only" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button type="submit" className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  {editingProductId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
