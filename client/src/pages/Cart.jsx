import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { toast } from 'react-toastify';
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  DollarSign,
  MapPin,
  Clock,
  Truck,
  ArrowLeft,
  AlertCircle,
  Package
} from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PaymentModal from '../components/layout/PaymentModal';
import { useAuth } from '../context/AuthContext';
import './CartAnimation.css';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load user profile data to get default address
  useQuery(
    'userProfile',
    async () => {
      const response = await api.get('/api/users/profile');
      return response.data.data;
    },
    {
      onSuccess: (data) => {
        if (data.address) {
          setDeliveryAddress(data.address);
        }
      },
      enabled: isAuthenticated,
    }
  );

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/menu');
        setMenuItems(response.data.data.dishes);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    console.log('Saved cart from localStorage:', savedCart);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Parsed cart:', parsedCart);
        setCart(parsedCart);
        setIsCartLoaded(true);
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        setCart({});
        setIsCartLoaded(true);
      }
    } else {
      // No saved cart, but still mark as loaded
      setIsCartLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  // Cart functions
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const removeItem = (itemId) => {
    const newCart = { ...cart };
    delete newCart[itemId];
    setCart(newCart);
    toast.success('Item removed from cart');
  };

  const getCartItems = () => {
    console.log('Cart data:', cart);
    console.log('Menu items:', menuItems);
    console.log('Menu items length:', menuItems.length);

    // If menu items are still loading, return empty array
    if (menuItems.length === 0) {
      console.log('Menu items not loaded yet, returning empty array');
      return [];
    }

    const items = Object.entries(cart).map(([itemId, quantity]) => {
      const item = menuItems.find(item => item._id === itemId);
      console.log(`Looking for item ${itemId}:`, item);
      return { ...item, quantity };
    }).filter(item => item._id); // Filter out items not found in menu

    console.log('Cart items after processing:', items);
    return items;
  };

  const getSubtotal = () => {
    return getCartItems().reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal(); // Only subtotal, no additional charges
  };

  // Place order mutation
  const placeOrderMutation = useMutation(
    async (orderData) => {
      const response = await api.post('/api/orders', orderData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Order placed successfully!');
        // Clear cart
        setCart({});
        localStorage.removeItem('cart');
        // Navigate to order details
        navigate(`/orders/${data.data.order._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to place order');
      },
    }
  );

  const handlePlaceOrder = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.info('Please login to place your order');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    // Validate required fields
    const errors = {};

    if (!deliveryAddress.trim()) {
      errors.deliveryAddress = 'Delivery address is required';
    }

    // Check if cart is empty
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      errors.cart = 'Your cart is empty';
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);

      // Show toast for the first error
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    const orderData = {
      items: cartItems.map(item => ({
        dishId: item._id,
        quantity: item.quantity,
        specialInstructions: ''
      })),
      paymentMethod,
      deliveryDetails: {
        address: deliveryAddress.trim(),
        specialInstructions: specialInstructions
      }
    };

    // If payment method is COD, place order directly
    if (paymentMethod === 'cod') {
      placeOrderMutation.mutate(orderData);
    } else {
      // For online payments, first place the order, then show payment modal
      try {
        const response = await api.post('/api/orders', orderData);
        const order = response.data.data.order;
        setCurrentOrder(order);
        setShowPaymentModal(true);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    }
  };

  const handlePaymentSuccess = (order) => {
    // Clear cart
    setCart({});
    localStorage.removeItem('cart');
    // Navigate to order details
    navigate(`/orders/${order._id}`);
  };

  const clearValidationError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const cartItems = getCartItems();

  // Show loading state while fetching menu items
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse-glow">
            <LoadingSpinner className="w-10 h-10 text-white animate-spin-slow" />
          </div>
          <p className="text-lg text-gray-700 font-semibold animate-slide-in">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center animate-fade-in">
        <div className="text-center px-4">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse-glow">
            <Package className="w-12 h-12 text-white animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 animate-slide-in">Your cart is empty</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto animate-fade-in">Add some delicious dishes to get started!</p>
          <button
            onClick={() => navigate('/menu')}
            className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl px-6 py-3 rounded-full text-lg font-bold animate-pop-in"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container-mobile py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Cart</h1>
          <p className="text-gray-600">Review your items and place your order</p>
        </div>

        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden space-y-3 sm:space-y-4">
          {/* Cart Items */}
          <div className="card bg-white shadow-lg border-0">
            <div className="card-header p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Order Items ({cartItems.length})
              </h2>
            </div>
            <div className="card-body p-3 sm:p-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-white via-blue-50 to-purple-50 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 animate-fade-in">
                    {/* Item Header - Image and Basic Info */}
                    <div className="flex items-start space-x-3 p-3">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-blue-400/40 group-hover:animate-pulse-glow transition-all duration-300">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-lg text-gray-900 mb-1 animate-slide-in">{item.name}</h3>
                        <p className="text-base font-bold text-green-700 animate-fade-in">₹{item.price.toFixed(2)}</p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item Footer - Quantity Controls and Total */}
                    <div className="flex items-center justify-between px-3 pb-3 bg-gray-50">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 font-medium">Qty:</span>
                        <div className="flex items-center bg-white/80 border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 flex items-center justify-center min-w-[36px] min-h-[36px]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 text-gray-600" />
                          </button>
                          <span className="font-semibold w-10 text-center text-sm bg-white border-x border-gray-300 py-1.5 min-h-[36px] flex items-center justify-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 flex items-center justify-center min-w-[36px] min-h-[36px]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Total:</div>
                        <div className="text-sm font-bold text-green-600">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Information - Moved before Order Summary */}
          <div className="card bg-white shadow-lg border-0">
            <div className="card-header p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Delivery Information
              </h2>
            </div>
            <div className="card-body p-3 sm:p-4 space-y-3">
              {!isAuthenticated ? (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Login Required</p>
                      <p className="text-xs text-blue-700">
                        Please login to enter delivery information and place your order.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        clearValidationError('deliveryAddress');
                      }}
                      placeholder="e.g., Office number 526"
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm ${validationErrors.deliveryAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                      rows="3"
                    />
                    {validationErrors.deliveryAddress ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {validationErrors.deliveryAddress}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        Please include floor and desk number in your address for accurate delivery
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special instructions for your order..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm"
                      rows="3"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Order Summary */}
          <div className="card bg-white shadow-lg border-0">
            <div className="card-header p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Order Summary
              </h2>
            </div>
            <div className="card-body p-3 sm:p-4">
              {/* Order Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-900">₹{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivery Fee</span>
                  <span className="text-sm font-semibold text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="text-green-600">₹{getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                  Payment Method
                </h3>
                {!isAuthenticated ? (
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Login Required</p>
                        <p className="text-xs text-gray-600">
                          Please login to select payment method and place your order.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 mb-2 ${paymentMethod === 'cod' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 shadow-md animate-pulse-glow' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                      />
                      <div className="p-1 bg-green-100 rounded mr-2">
                        <span className="text-sm font-bold text-green-600">₹</span>
                      </div>
                      <span className="text-sm font-medium">Cash on Delivery</span>
                    </label>
                    <label className="flex items-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                      />
                      <div className="p-1 bg-blue-100 rounded mr-2">
                        <QrCode className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">UPI/QR Code</span>
                    </label>
                    <label className="flex items-center p-2 border border-gray-200 rounded-lg cursor-not-allowed opacity-50 bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                        disabled
                      />
                      <div className="p-1 bg-gray-100 rounded mr-2">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-500">Credit/Debit Card</span>
                      <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Estimated Delivery */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg mb-4 border-2 border-blue-200 shadow-md flex items-center animate-fade-in">
                <div className="p-2 bg-blue-200 rounded-full mr-3 animate-pulse-glow">
                  <Clock className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Estimated Delivery</p>
                  <p className="text-xs text-blue-700">30-45 minutes</p>
                </div>
              </div>

              {/* Place Order Button */}
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-900">Login Required</p>
                        <p className="text-xs text-blue-700">
                          Please login to place your order and track your deliveries.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/login', { state: { from: '/cart' } })}
                    className="w-full btn-primary py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Login to Continue
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={placeOrderMutation.isLoading || !deliveryAddress.trim() || Object.keys(validationErrors).length > 0}
                  className="w-full btn-primary py-2.5 text-lg font-extrabold bg-gradient-to-r from-green-400 via-emerald-500 to-purple-500 hover:from-green-500 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl rounded-full animate-pop-in border-4 border-transparent hover:border-green-300 focus:ring-4 focus:ring-green-200 focus:outline-none focus:border-green-400"
                >
                  {placeOrderMutation.isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin-slow rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Placing Order...
                    </div>
                  ) : (
                    `Place Order - ₹${getTotal().toFixed(2)}`
                  )}
                </button>
              )}

              {/* Warning */}
              {isAuthenticated && paymentMethod === 'cod' && (
                <div className="mt-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      No extra cash on delivery orders.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg sm:text-xl font-semibold">Order Items</h2>
              </div>
              <div className="card-body">
                <div className="space-y-3 sm:space-y-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="border border-gray-200 rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-white via-blue-50 to-purple-50 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 animate-fade-in">
                      {/* Item Header - Image and Basic Info */}
                      <div className="flex items-start space-x-4 p-4">
                        {/* Item Image */}
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-lg text-gray-900 mb-1 animate-slide-in">{item.name}</h3>
                          <p className="text-base font-bold text-green-700 animate-fade-in">₹{item.price.toFixed(2)}</p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Item Footer - Quantity Controls and Total */}
                      <div className="flex items-center justify-between px-4 pb-4 bg-gray-50">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 font-medium">Quantity:</span>
                          <div className="flex items-center bg-white/80 border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="p-2.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 flex items-center justify-center min-w-[44px] min-h-[44px]"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-5 h-5 text-gray-600" />
                            </button>
                            <span className="font-semibold w-16 text-center text-base bg-white border-x border-gray-300 py-2.5 min-h-[44px] flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="p-2.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 flex items-center justify-center min-w-[44px] min-h-[44px]"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Total:</div>
                          <div className="text-base font-bold text-primary-600">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="card mt-4 sm:mt-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-xl rounded-xl animate-fade-in">
              <div className="card-header">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Delivery Information
                </h2>
              </div>
              <div className="card-body space-y-3 sm:space-y-4">
                {!isAuthenticated ? (
                  <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Login Required</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Please login to enter delivery information and place your order.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Delivery Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          clearValidationError('deliveryAddress');
                        }}
                        placeholder="e.g., Office number 526"
                        className={`input h-16 sm:h-20 resize-none text-xs sm:text-sm ${validationErrors.deliveryAddress ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                        rows="3"
                      />
                      {validationErrors.deliveryAddress ? (
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {validationErrors.deliveryAddress}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Please include floor and desk number in your address for accurate delivery
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Special Instructions (Optional)
                      </label>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special instructions for your order..."
                        className="input h-16 sm:h-20 resize-none text-xs sm:text-sm"
                        rows="3"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8 bg-gradient-to-br from-green-50 via-white to-purple-50 shadow-2xl rounded-xl animate-fade-in">
              <div className="card-header">
                <h2 className="text-xl font-semibold">Order Summary</h2>
              </div>
              <div className="card-body">
                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                  {!isAuthenticated ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Login Required</p>
                          <p className="text-sm text-gray-600">
                            Please login to select payment method and place your order.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 mb-2 ${paymentMethod === 'cod' ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 shadow-md animate-pulse-glow' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        <span>Cash on Delivery</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={paymentMethod === 'upi'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                        <span>UPI/QR Code</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-not-allowed opacity-50 bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                          disabled
                        />
                        <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="text-gray-500">Credit/Debit Card</span>
                        <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          Disabled
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>₹{getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Estimated Delivery</p>
                      <p className="text-sm text-blue-700">30-45 minutes</p>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                {!isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Login Required</p>
                          <p className="text-sm text-blue-700">
                            Please login to place your order and track your deliveries.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/login', { state: { from: '/cart' } })}
                      className="w-full btn-primary py-3 text-lg font-semibold"
                    >
                      Login to Continue
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isLoading || !deliveryAddress.trim() || Object.keys(validationErrors).length > 0}
                    className="w-full btn-primary py-3 text-lg font-extrabold bg-gradient-to-r from-green-400 via-emerald-500 to-purple-500 hover:from-green-500 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl rounded-full animate-pop-in border-4 border-transparent hover:border-green-300 focus:ring-4 focus:ring-green-200 focus:outline-none focus:border-green-400"
                  >
                    {placeOrderMutation.isLoading ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner className="w-5 h-5 mr-2 animate-spin-slow" />
                        Placing Order...
                      </div>
                    ) : (
                      `Place Order - ₹${getTotal().toFixed(2)}`
                    )}
                  </button>
                )}

                {/* Warning */}
                {isAuthenticated && paymentMethod === 'cod' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        No extra cash on delivery orders.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && currentOrder && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setCurrentOrder(null);
          }}
          order={currentOrder}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Cart;
