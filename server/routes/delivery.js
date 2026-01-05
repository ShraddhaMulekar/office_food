const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, isDeliveryStaff } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { deliveryStorageMulter } = require('../multer/delivery/deliveryStorageMulter');
const { deliveryUploadMulter } = require('../multer/delivery/deliveryUploadMulter');
const dashboardPage = require('../pages/delivery/dashboardPage');
const activeDeliveryOrderPage = require('../pages/delivery/activeDeliveryOrderPage');
const { assignedOrderBodyReq } = require('../bodyReq/delivery/assignedOrder-body-req');
const assignedOrderPage = require('../pages/delivery/assignOrderPage');
const { availabilityBodyReq } = require('../bodyReq/delivery/availability-body-req');
const { availabilityPage } = require('../pages/delivery/availabilityPage');
const { updateStatusOrderBodyReq } = require('../bodyReq/delivery/updateStatusOrder-body-req');
const { updateStatusOrderPage } = require('../pages/delivery/updateStatusOrderPage');
const { statusOrderBodyReq } = require('../bodyReq/delivery/statusOrder-body-req');
const statusOrderPage = require('../pages/delivery/statusOrderPage');
const staffProfilePage = require('../bodyReq/delivery/staffProfilePage');
const { updateStaffProfileBodyReq } = require('../bodyReq/delivery/updateStaffProfile-body-req');
const updateStaffProfilePage = require('../pages/delivery/updateStaffProfilePage');
const deliveredOrderPage = require('../pages/delivery/deliveredOrderPage');
const paymentPage = require('../pages/delivery/paymentPage');

const router = express.Router();

// Configure multer for payment proof uploads
const storage = deliveryStorageMulter;

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = deliveryUploadMulter;

// @route   GET /api/delivery/dashboard
// @desc    Get delivery dashboard data
// @access  Private/Delivery
router.get('/dashboard', protect, isDeliveryStaff, dashboardPage);

// @route   GET /api/delivery/orders
// @desc    Get assigned orders for delivery staff
// @access  Private/Delivery
router.get('/orders', protect, isDeliveryStaff, assignedOrderBodyReq, assignedOrderPage);

// @route   GET /api/delivery/orders/active
// @desc    Get active orders for delivery staff
// @access  Private/Delivery
router.get('/orders/active', protect, isDeliveryStaff, activeDeliveryOrderPage);

// @route   PUT /api/delivery/availability
// @desc    Update delivery staff availability
// @access  Private/Delivery
router.put('/availability', protect, isDeliveryStaff, availabilityBodyReq, availabilityPage);

// @route   PUT /api/delivery/orders/:id/status
// @desc    Update order status (for delivery staff)
// @access  Private/Delivery
router.put('/orders/:id/status', protect, isDeliveryStaff, updateStatusOrderBodyReq, updateStatusOrderPage);

// @route   GET /api/delivery/stats
// @desc    Get delivery statistics for delivery staff
// @access  Private/Delivery
router.get('/stats', protect, isDeliveryStaff, statusOrderBodyReq, statusOrderPage);

// @route   GET /api/delivery/profile
// @desc    Get delivery staff profile
// @access  Private/Delivery
router.get('/profile', protect, isDeliveryStaff, staffProfilePage);

// @route   PUT /api/delivery/profile
// @desc    Update delivery staff profile
// @access  Private/Delivery
router.put('/profile', protect, isDeliveryStaff, updateStaffProfileBodyReq, updateStaffProfilePage);

// @route   PUT /api/delivery/orders/:id/delivered
// @desc    Mark order as delivered (for online payments only)
// @access  Private/Delivery
router.put('/orders/:id/delivered', protect, isDeliveryStaff, deliveredOrderPage);

// @route   PUT /api/delivery/orders/:id/payment-proof
// @desc    Upload payment proof for COD orders
// @access  Private/Delivery
router.put('/orders/:id/payment-proof', protect, isDeliveryStaff, upload.single('paymentProof'), paymentPage);

module.exports = router; 