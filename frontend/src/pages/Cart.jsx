import { Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, ShieldCheck, CreditCard, Lock } from 'lucide-react';

export default function Cart() {
  const { isVendor } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (isVendor) {
    return <Navigate to="/dashboard/vendor" replace />;
  }

  const shippingCost = cartTotal > 50 || cartItems.length === 0 ? 0 : 5.99;
  const taxRate = 0.08;
  const taxAmount = cartTotal * taxRate;
  const orderTotal = cartTotal + shippingCost + taxAmount;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 text-center transition-colors duration-200">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-indigo-300 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Discover great products in our catalog.</p>
          <Link to="/products" className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Start Shopping <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Cart Items */}
        <div className="lg:w-2/3 space-y-6">
          {cartItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-6 group transition-colors duration-200">
              {/* Thumbnail */}
              <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0].image || item.images[0].image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 w-full flex flex-col justify-between h-full py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 pr-4">{item.title}</h3>
                    <div className="font-extrabold text-lg text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                  
                  {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Object.entries(item.selected_options).map(([k, v]) => (
                        <span key={k} className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Vendor ID: <span className="font-mono text-xs">{item.vendor?.substring(0,8)}</span>
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  {/* Quantity Stepper & Indicator */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 h-10 w-32">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center font-semibold text-gray-900 dark:text-white text-sm bg-white dark:bg-gray-800 h-full flex items-center justify-center border-x border-gray-200 dark:border-gray-600">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.inventory?.stock !== undefined ? item.inventory.stock : (item.stock !== undefined ? item.stock : 99))}
                        className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {item.quantity >= (item.inventory?.stock !== undefined ? item.inventory.stock : (item.stock !== undefined ? item.stock : 99)) && (
                      <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">Max stock reached</span>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 sticky top-24 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                <span className="font-medium text-gray-900 dark:text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping Estimate</span>
                {shippingCost === 0 ? (
                  <span className="font-bold text-green-600 dark:text-green-400">Free</span>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">${shippingCost.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Estimated Tax (8%)</span>
                <span className="font-medium text-gray-900 dark:text-white">${taxAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">${orderTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <Link 
              to="/checkout" 
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold px-6 py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 mb-4"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Checkout
            </Link>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Lock className="w-4 h-4" /> Secure SSL Checkout
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
