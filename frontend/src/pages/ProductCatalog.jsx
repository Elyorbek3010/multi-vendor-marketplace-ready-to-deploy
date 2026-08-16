import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export default function ProductCatalog() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedCategory = searchParams.get('category');
  const search = searchParams.get('search') || '';
  const ordering = searchParams.get('ordering') || '-created_at';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [paginationInfo, setPaginationInfo] = useState({ count: 0, next: null, previous: null });

  useEffect(() => {
    const params = {
      page,
      ordering,
    };
    if (selectedCategory) params.category = selectedCategory;
    if (search) params.search = search;

    api.get('/products/items/', { params })
      .then(res => {
        if (res.data && res.data.results) {
          setProducts(res.data.results);
          setPaginationInfo({
            count: res.data.count,
            next: res.data.next,
            previous: res.data.previous
          });
        } else {
          setProducts(Array.isArray(res.data) ? res.data : []);
          setPaginationInfo({ count: Array.isArray(res.data) ? res.data.length : 0, next: null, previous: null });
        }
      })
      .catch(err => { console.error(err); setProducts([]); });
  }, [selectedCategory, search, ordering, page]);

  useEffect(() => {
    api.get('/products/categories/')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : (res.data?.results || [])))
      .catch(console.error);
  }, []);

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = e.target.searchQuery.value;
    updateParams({ search: query, page: 1 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Product Catalog</h2>
        
        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input 
              type="text" 
              name="searchQuery"
              defaultValue={search}
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </form>
          
          <div className="relative">
            <select 
              value={ordering}
              onChange={(e) => updateParams({ ordering: e.target.value, page: 1 })}
              className="appearance-none pl-10 pr-8 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="-created_at">Newest Arrivals</option>
              <option value="-average_rating">Top Rated</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
            </select>
            <SlidersHorizontal className="absolute left-3 top-2.5 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>
      
      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          <button 
            onClick={() => updateParams({ category: null, page: 1 })}
            className={`px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm hover:shadow-md border ${
              !selectedCategory 
                ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            All Categories
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => updateParams({ category: c.id, page: 1 })}
              className={`px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm hover:shadow-md border ${
                selectedCategory === c.id.toString()
                  ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
        Showing {products.length} of {paginationInfo.count} results
      </div>

      {Array.isArray(products) && products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                user={user} 
                onAddToCart={addToCart} 
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {(paginationInfo.next || paginationInfo.previous) && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button 
                onClick={() => updateParams({ page: page - 1 })}
                disabled={!paginationInfo.previous}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Page {page}</span>
              <button 
                onClick={() => updateParams({ page: page + 1 })}
                disabled={!paginationInfo.next}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-colors"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No products match your criteria.</p>
          <button 
            onClick={() => setSearchParams({})} 
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
