import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  Flame,
  Leaf,
  Zap,
  Heart,
  Utensils
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './CartAnimation.css';

const Menu = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDiet, setSelectedDiet] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [cart, setCart] = useState({});
  const [favorites, setFavorites] = useState([]);

  // Load cart and favorites from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedFavorites = localStorage.getItem('favorites');

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch menu data
  const { data: menuItems, isLoading, error } = useQuery(
    'menu',
    async () => {
      const response = await api.get('/api/menu');
      return response.data.data.dishes;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get unique categories
  const categories = menuItems ? [...new Set(menuItems.map(item => item.category))] : [];
  const diets = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Gluten-Free'];

  // Filter and sort menu items
  const filteredItems = menuItems
    ? menuItems
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesDiet = selectedDiet === 'all' || item.dietaryInfo?.includes(selectedDiet);
        return matchesSearch && matchesCategory && matchesDiet;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price-low':
            return a.price - b.price;
          case 'price-high':
            return b.price - a.price;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'popularity':
            return (b.orderCount || 0) - (a.orderCount || 0);
          default:
            return 0;
        }
      })
    : [];

  // Cart functions
  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1
    }));
    toast.success(`${item.name} added to cart!`);
  };

  const removeFromCart = (item) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[item._id] > 1) {
        newCart[item._id] -= 1;
      } else {
        delete newCart[item._id];
      }
      return newCart;
    });
  };

  const getCartItemCount = (itemId) => cart[itemId] || 0;

  const getTotalCartItems = () => Object.values(cart).reduce((sum, count) => sum + count, 0);

  const getTotalPrice = () => {
    return menuItems
      ? Object.entries(cart).reduce((total, [itemId, quantity]) => {
        const item = menuItems.find(item => item._id === itemId);
        return total + (item?.price || 0) * quantity;
      }, 0)
      : 0;
  };

  // Favorite functions
  const toggleFavorite = (itemId) => {
    const item = menuItems?.find(item => item._id === itemId);
    const isCurrentlyFavorite = favorites.includes(itemId);

    setFavorites(prev => {
      const newFavorites = isCurrentlyFavorite
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];

      // Show toast notification
      if (isCurrentlyFavorite) {
        toast.info(`${item?.name || 'Item'} removed from favorites`);
      } else {
        toast.success(`${item?.name || 'Item'} added to favorites! ❤️`);
      }

      return newFavorites;
    });
  };

  const isFavorite = (itemId) => favorites.includes(itemId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">Failed to load menu</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-mobile py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Our Menu</h1>
              <p className="text-sm sm:text-base text-gray-600">Discover delicious dishes from our curated selection</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-600">
                {filteredItems.length} items found
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card mb-4 sm:mb-6 lg:mb-8">
          <div className="card-body p-3 sm:p-4 lg:p-6">
            {/* Mobile: Stacked Layout */}
            <div className="block sm:hidden space-y-3">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 text-sm w-full"
                  />
                </div>
              </div>

              {/* Filters Row 1 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input text-sm w-full"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diet</label>
                  <select
                    value={selectedDiet}
                    onChange={(e) => setSelectedDiet(e.target.value)}
                    className="input text-sm w-full"
                  >
                    <option value="all">All Diets</option>
                    {diets.map(diet => (
                      <option key={diet} value={diet}>
                        {diet}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input text-sm w-full"
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Category Filter with Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input pl-10 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diet Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diet
                </label>
                <select
                  value={selectedDiet}
                  onChange={(e) => setSelectedDiet(e.target.value)}
                  className="input text-sm"
                >
                  <option value="all">All Diets</option>
                  {diets.map(diet => (
                    <option key={diet} value={diet}>
                      {diet}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input text-sm"
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="relative">
                {/* Item Image */}
                <div className="aspect-[4/3] sm:aspect-square bg-gray-200 rounded-t-lg overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Utensils className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(item._id)}
                  className={`absolute top-2 right-2 p-1 sm:p-1.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${isFavorite(item._id)
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-white/90 backdrop-blur-sm hover:bg-white'
                    }`}
                  aria-label={isFavorite(item._id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <div className="flex items-center justify-center">
                    <Heart
                      className={`w-8 h-8 sm:w-8 sm:h-8 transition-all duration-300 ${isFavorite(item._id)
                          ? 'text-white fill-current'
                          : 'text-gray-500 hover:text-red-400'
                        }`}
                    />
                  </div>

                </button>

                {/* Dietary Badges */}
                {item.dietaryInfo && (
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {item.dietaryInfo.includes('Vegetarian') && (
                      <span className="badge-success text-xs px-2 py-1">
                        <Leaf className="w-3 h-3 mr-1" />
                        Veg
                      </span>
                    )}
                    {item.dietaryInfo.includes('Vegan') && (
                      <span className="badge-success text-xs px-2 py-1">
                        <Leaf className="w-3 h-3 mr-1" />
                        Vegan
                      </span>
                    )}
                    {item.dietaryInfo.includes('Gluten-Free') && (
                      <span className="badge-warning text-xs px-2 py-1">
                        <Zap className="w-3 h-3 mr-1" />
                        GF
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="card-body p-3 sm:p-4">
                {/* Item Name and Description */}
                <div className="mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Price and Rating */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg sm:text-xl font-bold text-primary-600">
                      ₹{item.price}
                    </span>
                    {item.rating && typeof item.rating.average === 'number' && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {item.rating.average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  {item.preparationTime && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{item.preparationTime}min</span>
                    </div>
                  )}
                </div>

                {/* Add to Cart Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCartItemCount(item._id) > 0 ? (
                      <>
                        <button
                          onClick={() => removeFromCart(item)}
                          className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-200 hover:border-red-300 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 group"
                          aria-label="Remove from cart"
                        >
                          <Minus className="w-4 h-4 text-red-600 group-hover:text-red-700 transition-colors duration-200" />
                        </button>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg px-4 py-2 rounded-full shadow-lg min-w-[48px] text-center animate-pulse-glow">
                          {getCartItemCount(item._id)}
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          className="p-2.5 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 hover:border-green-300 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 group"
                          aria-label="Add to cart"
                        >
                          <Plus className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors duration-200" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-full hover:shadow-xl transition-all duration-300 text-sm font-bold shadow-lg hover:scale-105 active:scale-95 animate-pop-in"
                        aria-label="Add to cart"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>

                  {/* Popularity Indicator */}
                  {item.orderCount > 10 && (
                    <div className="flex items-center space-x-1 text-xs text-orange-600">
                      <Flame className="w-3 h-3" />
                      <span>Popular</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No dishes found</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Cart Summary - Fixed Bottom on Mobile */}
        {getTotalCartItems() > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 animate-slide-in">
            {/* Cart Header with Animation */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-3 sm:px-4 py-2">
              <div className="max-w-7xl mx-auto flex items-center justify-center">
                <div className="flex items-center space-x-2 text-white">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold">
                    Your cart is ready! 🎉
                  </span>
                </div>
              </div>
            </div>

            {/* Cart Content */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 lg:py-4 bg-gradient-to-br from-gray-50 to-white">
              <div className="max-w-7xl mx-auto">
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-md animate-pulse-glow">
                          {getTotalCartItems()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {getTotalCartItems()} item{getTotalCartItems() !== 1 ? 's' : ''} in cart
                        </div>
                        <div className="text-xs text-gray-500">
                          Tap to view details
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-sm sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{getTotalPrice().toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/cart')}
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-purple-500 hover:from-green-600 hover:via-emerald-600 hover:to-purple-600 text-white font-bold py-3 sm:py-3.5 px-3 sm:px-4 rounded-full transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl text-sm hover:scale-105 active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>View Cart & Checkout</span>
                  </button>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-md animate-pulse-glow">
                          {getTotalCartItems()}
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          {getTotalCartItems()} item{getTotalCartItems() !== 1 ? 's' : ''} in your cart
                        </div>
                        <div className="text-sm text-gray-500">
                          Ready to place your order
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total Amount</div>
                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{getTotalPrice().toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setCart({});
                        localStorage.removeItem('cart');
                        toast.success('Cart cleared!');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-200"
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={() => navigate('/cart')}
                      className="bg-gradient-to-r from-green-500 via-emerald-500 to-purple-500 hover:from-green-600 hover:via-emerald-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 flex items-center space-x-2 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>View Cart & Checkout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding to account for fixed cart summary */}
        {getTotalCartItems() > 0 && (
          <div className="h-24 sm:h-28 lg:h-32"></div>
        )}
      </div>
    </div>
  );
};

export default Menu; 
