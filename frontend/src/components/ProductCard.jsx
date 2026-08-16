import { Link } from 'react-router-dom';
import { ShoppingCart, ImageIcon, Edit, Star } from 'lucide-react';

export default function ProductCard({ product, user, onAddToCart }) {
  const isOwner = user && user.vendor_id === product.vendor;
  const imageSrc = product.images && product.images.length > 0 ? (product.images[0].image || product.images[0].image_url) : null;

  return (
    <div className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={product.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-16 h-16 opacity-50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.category_name && (
            <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {product.category_name}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="bg-indigo-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md">
            ${product.price}
          </span>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <Link to={`/products/${product.id}`}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 mb-1">
              {product.title}
            </h3>
          </Link>
          
          {product.review_count > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{product.average_rating?.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({product.review_count})</span>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {product.inventory?.stock > 0 ? (
              <span className="text-green-600 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>In Stock</span>
            ) : (
              <span className="text-red-500 flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>Out of Stock</span>
            )}
          </div>
          
          {isOwner ? (
            <Link 
              to="/dashboard/vendor#products" 
              className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Link>
          ) : (
            <button 
              onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
              className="flex items-center justify-center w-10 h-10 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition-colors shadow-sm"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
