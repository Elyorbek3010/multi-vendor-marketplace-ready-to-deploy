import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Minus, Plus, ShoppingCart, ShieldCheck, CheckCircle2, Package, Truck, RefreshCcw, Star } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api.get(`/products/items/${id}/`)
      .then(res => {
        setProduct(res.data);
        if (res.data.images && res.data.images.length > 0) {
          setActiveImage(res.data.images[0].image || res.data.images[0].image_url);
        }
        if (res.data.options) {
          const defaultOptions = {};
          Object.keys(res.data.options).forEach(key => {
            if (Array.isArray(res.data.options[key]) && res.data.options[key].length > 0) {
              defaultOptions[key] = res.data.options[key][0];
            }
          });
          setSelectedOptions(defaultOptions);
        }
      })
      .catch(console.error);

    api.get(`/products/${id}/reviews/`)
      .then(res => setReviews(res.data.results || res.data))
      .catch(console.error);

    if (user) {
      api.get(`/products/${id}/can_review/`)
        .then(res => setCanReview(res.data.can_review))
        .catch(() => setCanReview(false));
    }
  }, [id, user]);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isOwner = user && user.vendor_id === product.vendor;
  const inStock = product.inventory ? product.inventory.stock > 0 : true;
  const maxStock = product.inventory ? product.inventory.stock : 99;
  
  const cartItem = cartItems?.find(item => item.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, maxStock - cartQty);

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= remainingStock) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedOptions);
    setQuantity(1); // Reset stepper after adding
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await api.post(`/products/${id}/reviews/`, reviewForm);
      setReviews([res.data, ...reviews]);
      setCanReview(false);
      setReviewForm({ rating: 5, comment: '' });
      // Update product avg rating and count locally
      setProduct(prev => ({
        ...prev,
        review_count: (prev.review_count || 0) + 1,
        average_rating: prev.review_count 
          ? ((prev.average_rating * prev.review_count) + reviewForm.rating) / (prev.review_count + 1)
          : reviewForm.rating
      }));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        
        {/* Top 2-Column Layout */}
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-700">
            <div className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center overflow-hidden mb-4 relative">
              {activeImage ? (
                <img src={activeImage} alt={product.title} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-24 h-24 text-gray-300" />
              )}
            </div>
            
            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => {
                  const src = img.image || img.image_url;
                  return (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(src)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeImage === src ? 'border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900/30' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      <img src={src} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Product Info */}
          <div className="lg:w-1/2 p-6 lg:p-10 flex flex-col">
            <div className="mb-2">
              <span className="text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                {product.category_name || 'General'}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
              {product.title}
            </h1>

            {product.review_count > 0 && (
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{product.average_rating?.toFixed(1)}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">({product.review_count} reviews)</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">${product.price}</div>
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-8 line-clamp-3">
              {product.description}
            </p>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-8 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  Verified Vendor
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Secure transaction guaranteed by Marketplace</p>
              </div>
            </div>

            <div className="mt-auto">
              {isOwner ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-yellow-800 dark:text-yellow-600 mb-3">This is your own product. You cannot purchase it.</p>
                  <Link 
                    to="/dashboard/vendor#products" 
                    className="inline-flex justify-center items-center w-full bg-gray-900 dark:bg-gray-700 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                  >
                    Manage Listing
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Options Selection */}
                  {product.options && Object.keys(product.options).length > 0 && (
                    <div className="flex flex-col gap-3 mb-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                      {Object.entries(product.options).map(([optionName, optionValues]) => (
                        <div key={optionName} className="flex flex-col gap-1">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{optionName}</label>
                          <select 
                            value={selectedOptions[optionName] || ''}
                            onChange={(e) => setSelectedOptions({...selectedOptions, [optionName]: e.target.value})}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white outline-none"
                          >
                            {Array.isArray(optionValues) && optionValues.map((val, idx) => (
                              <option key={idx} value={val}>{val}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 h-14 w-full sm:w-36 overflow-hidden">
                    <button 
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1 || remainingStock === 0}
                      className="w-12 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-semibold text-gray-900 dark:text-white">{remainingStock === 0 ? 0 : quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= remainingStock}
                      className="w-12 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Add to Cart */}
                  <button 
                    onClick={handleAddToCart}
                    disabled={!inStock || remainingStock === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {!inStock ? 'Out of Stock' : (remainingStock === 0 ? 'Max Stock in Cart' : 'Add to Cart')}
                  </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        
        {/* Bottom Tabs */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 lg:px-10 overflow-x-auto">
            {['description', 'specifications', 'shipping', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-5 px-6 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'shipping' ? 'Shipping & Returns' : (tab === 'reviews' ? `Reviews (${product.review_count || 0})` : tab)}
              </button>
            ))}
          </div>
          
          <div className="p-6 lg:p-10 min-h-[200px]">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-gray-600 dark:text-gray-300">
                <p>{product.description}</p>
              </div>
            )}
            
            {activeTab === 'specifications' && (
              <div className="text-gray-600 dark:text-gray-300">
                <ul className="space-y-3">
                  <li className="flex pb-3 border-b border-gray-100 dark:border-gray-700"><span className="w-1/3 font-semibold text-gray-900 dark:text-white">Category</span><span>{product.category_name || 'General'}</span></li>
                  <li className="flex pb-3 border-b border-gray-100 dark:border-gray-700"><span className="w-1/3 font-semibold text-gray-900 dark:text-white">Stock Status</span><span>{product.inventory?.stock > 0 ? `${product.inventory.stock} Available` : 'Out of Stock'}</span></li>
                  <li className="flex pb-3 border-b border-gray-100 dark:border-gray-700"><span className="w-1/3 font-semibold text-gray-900 dark:text-white">Vendor ID</span><span className="text-sm font-mono">{product.vendor}</span></li>
                </ul>
              </div>
            )}
            
            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 dark:text-gray-300">
                <div className="flex gap-4">
                  <Truck className="w-8 h-8 text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Standard Shipping</h4>
                    <p className="text-sm">Delivery usually within 3-5 business days. Free shipping on orders over $50.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <RefreshCcw className="w-8 h-8 text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">30-Day Returns</h4>
                    <p className="text-sm">Not satisfied? Return it within 30 days for a full refund or exchange.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {canReview && (
                  <form onSubmit={submitReview} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Write a Review</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            type="button" 
                            key={star} 
                            onClick={() => setReviewForm({...reviewForm, rating: star})}
                          >
                            <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Comment</label>
                      <textarea 
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-700 dark:text-white bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        rows="3"
                        placeholder="What did you think of this product?"
                        required
                      ></textarea>
                    </div>
                    <button type="submit" disabled={submittingReview} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}

                {reviews.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">No reviews yet.</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                              {review.buyer_name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{review.buyer_name}</p>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} className={`w-3 h-3 ${review.rating >= star ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-3">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
