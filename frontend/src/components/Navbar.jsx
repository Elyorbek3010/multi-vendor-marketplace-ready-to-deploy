import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingCart, Search, ChevronDown, LogOut, User, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isVendor } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path) => {
    setIsDropdownOpen(false);
    if (path) navigate(path);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight">Marketplace</Link>
            <div className="hidden md:flex space-x-6">
              <Link to="/products" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Catalog</Link>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={toggleTheme} className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {(!user || !isVendor) && (
              <Link to="/products" className="relative text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer hidden sm:block transition-colors">
                <Search className="h-5 w-5" />
              </Link>
            )}
            
            {(!user || !isVendor) && (
              <Link to="/cart" className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 relative transition-colors mr-2">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            
            {user ? (
              <div className="relative flex items-center pl-4 border-l" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    {user.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.username}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 border dark:border-gray-700 z-50 transition-colors duration-200">
                    
                    {(!isVendor) && (
                      <>
                        <button onClick={() => handleNav('/profile')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profile Settings</button>
                        <button onClick={() => handleNav('/orders')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Orders</button>
                      </>
                    )}
                    
                    {isVendor && (
                      <>
                        <button onClick={() => handleNav('/dashboard/vendor')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Vendor Dashboard</button>
                        <button onClick={() => handleNav('/dashboard/vendor#products')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">My Shop Listings</button>
                      </>
                    )}
                    
                    {user.role === 'ADMIN' && (
                      <>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                        <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Admin Panel</a>
                      </>
                    )}
                    
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); logout(); }} 
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4 pl-4 border-l">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
                <Link to="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
