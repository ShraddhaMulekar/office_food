const express = require('express');
const Order = require('../models/Order');
const Menu = require('../models/Menu');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, isAdmin, isDeliveryStaff, isEmployee, isAdminOrDelivery, isAdminOrEmployee } = require('../middleware/auth');
const { newOrderBodyReq } = require('../bodyReq/orders/newOrder-body-req');
const { newOrderPage } = require('../pages/orders/newOrderPage');
const { userOrdersBodyReq } = require('../bodyReq/orders/userOrders-body-req');
const { userOrderPage } = require('../pages/orders/userOrderPage');
const { singleOrderPage } = require('../pages/orders/singleOrderPage');
const { updateOrderBodyReq } = require('../bodyReq/orders/updateOrder-body-req');
const { updateOrderPage } = require('../pages/orders/updateOrderPage');
const { deliveryOrderBodyReq } = require('../bodyReq/orders/deliveryOrder-body-req');
const { deliveryOrderPage } = require('../pages/orders/deliveryOrderPage');
const { cancelOrderBodyReq } = require('../bodyReq/orders/cancelOrder-body-req');
const { cancelOrderPage } = require('../pages/orders/cancelOrderPage');
const { rateOrderBodyReq } = require('../bodyReq/orders/rateOrder-body-req');
const { rateOrderPage } = require('../pages/orders/rateOrderPage');
const trackOrderPage = require('../pages/orders/trackOrderPage');

const router = express.Router();

// @route   POST /api/orders
// @desc    Place a new order
// @access  Private
router.post('/', protect, isAdminOrEmployee, newOrderBodyReq, newOrderPage);

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, userOrdersBodyReq, userOrderPage);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', protect, singleOrderPage);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin/Delivery staff)
// @access  Private/Admin/Delivery
router.put('/:id/status', protect, isAdminOrDelivery, updateOrderBodyReq, updateOrderPage);

// @route   PUT /api/orders/:id/assign-delivery
// @desc    Assign delivery staff to order (Admin only)
// @access  Private/Admin
router.put('/:id/assign-delivery', protect, isAdmin, deliveryOrderBodyReq, deliveryOrderPage);

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post('/:id/cancel', protect, cancelOrderBodyReq, cancelOrderPage);

// @route   POST /api/orders/:id/rate
// @desc    Rate order
// @access  Private
router.post('/:id/rate', protect, rateOrderBodyReq, rateOrderPage);

// @route   GET /api/orders/track/:orderNumber
// @desc    Track order by order number
// @access  Public (with optional auth)
router.get('/track/:orderNumber', trackOrderPage);

module.exports = router; 