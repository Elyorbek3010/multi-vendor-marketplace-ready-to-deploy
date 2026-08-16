import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShieldCheck, Truck, Lock } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/products/items/')
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setProducts(items.slice(0, 8)); // Just show 8 featured
      })
      .catch(console.error);
      
    api.get('/products/categories/')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data?.results || [])))
      .catch(console.error);
  }, []);

  return (
    <div className="-mt-8"> {/* Negative margin to counteract the main container's py-8 */}
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-b-3xl sm:rounded-3xl overflow-hidden shadow-2xl mb-16 px-6 py-20 sm:py-32 sm:px-12 text-center lg:text-left mx-[-1rem] sm:mx-0">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Discover Exceptional Products from Top Vendors
          </h1>
          <p className="text-xl sm:text-2xl text-indigo-100 mb-10 max-w-2xl font-light">
            Your premium destination for curated, high-quality items spanning tech, fashion, and lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/products" className="bg-white text-indigo-900 px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg">
              Start Shopping
            </Link>
            {!user && (
              <Link to="/register" className="bg-indigo-600/30 text-white backdrop-blur-md border border-indigo-400/30 px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-600/50 transition-colors">
                Become a Vendor
              </Link>
            )}
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
      </div>

      {/* Trust Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-6">
            <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verified Sellers</h3>
          <p className="text-gray-600 dark:text-gray-400">Every vendor on our platform undergoes a strict verification process to ensure quality.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-6">
            <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fast Fulfillment</h3>
          <p className="text-gray-600 dark:text-gray-400">Direct integration with seller dashboards means your orders are processed immediately.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-colors">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-6">
            <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Secure Checkout</h3>
          <p className="text-gray-600 dark:text-gray-400">Your payment information is encrypted and securely processed by industry leaders.</p>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map(c => (
              <Link key={c.id} to={`/products?category=${c.id}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-full font-medium hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm hover:shadow-md inline-block">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div className="mb-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <Link to="/products" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors hidden sm:block">View All →</Link>
        </div>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                user={user} 
                onAddToCart={addToCart} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-12 text-center transition-colors">
            <p className="text-gray-500 dark:text-gray-400">Loading amazing products...</p>
          </div>
        )}
      </div>

    </div>
  );
}
