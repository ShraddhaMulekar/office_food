const express = require('express');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Notification = require('../models/Notification');
const { protect, isAdmin, isAdminOrDelivery } = require('../middleware/auth');
const { adminStorageMulter } = require('../multer/admin/adminStorageMulter');
const { adminUploadMulter } = require('../multer/admin/adminUplodeMulter');
const { uploadImagePage } = require('../pages/admin/uploadImagePage');
const { adminDashboardBodyReq } = require('../bodyReq/admin/adminDashboard-body-req');
const adminDashboardPage = require('../pages/admin/adminDashboardPage');
const { orderBodyReq } = require('../bodyReq/admin/order-body-req');
const orderPage = require('../pages/admin/orderPage');
const { allUsersBodyReq } = require('../bodyReq/admin/allUsers-body-req');
const allUserPage = require('../pages/admin/allUserPage');
const { updateUserBodyReq } = require('../bodyReq/admin/updateUser-body-req');
const { updateUserPage } = require('../pages/admin/updateUserPage');
const { updateUserStatusBodyReq } = require('../bodyReq/admin/updateUserStatus-body-req');
const { updateUserStatusPage } = require('../pages/admin/updateUserStatusPage');
const { deleteUserPage } = require('../pages/admin/deleteUserPage');
const menuAdminPage = require('../pages/admin/menuAdminPage');
const { dailyCountMenuPage } = require('../pages/admin/dailyCountMenuPage');
const { revenueBodyReq } = require('../bodyReq/admin/revenue-body-req');
const { revenuePage } = require('../pages/admin/revenuePage');
const { orderAnalyticsBodyReq } = require('../bodyReq/admin/ordersAnalytics-body-req');
const { ordersAnalyticsPage } = require('../pages/admin/orderAnalyticsPage');
const { broadcastBodyReq } = require('../bodyReq/admin/broadcast-body-req');
const { broadcastPage } = require('../pages/admin/broadcastPage');
const { paymentsBodyReq } = require('../bodyReq/admin/payments-body-req');
const paymentPage = require('../pages/admin/paymentPage');
const deliveryAgentPage = require('../pages/admin/deliveryAgentsPage');
const deliveryStaffPage = require('../pages/admin/deliveryStaffPage');
const updateOrderStatusPage = require('../pages/admin/updateOrderStatusPage');
const { updateOrderStatusBodyReq } = require('../bodyReq/admin/updateOrderStatus-body-req');
const { autoAssignOrderPage } = require('../pages/admin/autoAssignOrderPage');
const { refundPaymentBodyReq } = require('../bodyReq/admin/refundPayment-body-req');
const { refundPaymentPage } = require('../pages/admin/refundPaymentPage');
const { allMenuBodyReq } = require('../bodyReq/admin/allMenu-body-req');
const allMenuPage = require('../pages/admin/allMenuPage');
const { createNewMenuBodyReq } = require('../bodyReq/admin/createNewMenu-body-req');
const { createNewMenuPage } = require('../pages/admin/createNewMenuPage');
const { updateMenuBodyReq } = require('../bodyReq/admin/updateMenu-body-req');
const { updateMenuPage } = require('../pages/admin/updateMenuPage');
const { deleteMenuPage } = require('../pages/admin/deleteMenuPage');
const { categoriesPage } = require('../pages/admin/categoriesPage');
const { testNotificationPage } = require('../pages/admin/testNotificationPage');
const { notificationBodyReq } = require('../bodyReq/admin/notification-body-req');
const notificationPage = require('../pages/admin/notificationPage');
const { readMarkNotificationPage } = require('../pages/admin/readMarkNotificationPage');
const { allReadMarkNotificationPage } = require('../pages/admin/allReadMarkNotificationPage');
const { allDeleteNotificationPage } = require('../pages/admin/allDeleteNotificationPage');
const { singleNotificationDeletePage } = require('../pages/admin/singleNotificatonDeletePage');
const { soundNotificationPage } = require('../pages/admin/soundNotificationPage');
const { updateNotificationSoundBodyReq } = require('../bodyReq/admin/updateNotificationSound-body-req');
const { updateNotificationSoundPage } = require('../pages/admin/updateNotificationSoundPage');
const { updateUserNotificationBodyReq } = require('../bodyReq/admin/updateUserNotification-body-req');
const { updateUserNotificationPage } = require('../pages/admin/updateUserNotificationPage');
const { newUserBodyReq } = require('../bodyReq/admin/new-user-body-req');
const { newUserPage } = require('../pages/admin/newUserPage');

const router = express.Router();

// Configure multer for image uploads
const storage = adminStorageMulter;

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = adminUploadMulter;

// @route   POST /api/admin/upload-image
// @desc    Upload image for menu items
// @access  Private/Admin
router.post('/upload-image', protect, isAdmin, upload.single('image'), uploadImagePage);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', protect, isAdminOrDelivery, adminDashboardBodyReq, adminDashboardPage);

// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private/Admin
router.get('/orders', protect, isAdmin, orderBodyReq, orderPage);

// @route   GET /api/admin/users
// @desc    Get all users for admin
// @access  Private/Admin
router.get('/users', protect, isAdmin, allUsersBodyReq, allUserPage);

// @route   PUT /api/admin/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/users/:id', protect, isAdmin, updateUserBodyReq, updateUserPage);

// @route   PATCH /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private/Admin
router.patch('/users/:id/status', protect, isAdmin, updateUserStatusBodyReq, updateUserStatusPage);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/users/:id', protect, isAdmin, deleteUserPage);

// @route   GET /api/admin/menu/stats
// @desc    Get menu statistics
// @access  Private/Admin
router.get('/menu/stats', protect, isAdmin, menuAdminPage);

// @route   POST /api/admin/menu/reset-daily-counts
// @desc    Reset daily sold counts for all dishes
// @access  Private/Admin
router.post('/menu/reset-daily-counts', protect, isAdmin, dailyCountMenuPage);

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue analytics
// @access  Private/Admin
router.get('/analytics/revenue', protect, isAdmin, revenueBodyReq, revenuePage);

// @route   GET /api/admin/analytics/orders
// @desc    Get order analytics
// @access  Private/Admin
router.get('/analytics/orders', protect, isAdmin, orderAnalyticsBodyReq, ordersAnalyticsPage);

// @route   POST /api/admin/notifications/broadcast
// @desc    Send broadcast notification to all users
// @access  Private/Admin
router.post('/notifications/broadcast', protect, isAdmin, broadcastBodyReq, broadcastPage);

// @route   GET /api/admin/payments
// @desc    Get all payments for admin
// @access  Private/Admin
router.get('/payments', protect, isAdmin, paymentsBodyReq, paymentPage);

// @route   GET /api/admin/delivery-agents
// @desc    Get available delivery agents
// @access  Private/Admin
router.get('/delivery-agents', protect, isAdmin, deliveryAgentPage);

// @route   GET /api/admin/delivery-staff
// @desc    Get all delivery staff (for backward compatibility)
// @access  Private/Admin
router.get('/delivery-staff', protect, isAdmin, deliveryStaffPage);

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', protect, isAdmin, updateOrderStatusBodyReq, updateOrderStatusPage);

// @route   POST /api/admin/orders/auto-assign
// @desc    Auto-assign ready orders to available delivery staff
// @access  Private/Admin
router.post('/orders/auto-assign', protect, isAdmin, autoAssignOrderPage);

// @route   POST /api/admin/payments/refund
// @desc    Process refund for an order
// @access  Private/Admin
router.post('/payments/refund', protect, isAdmin, refundPaymentBodyReq, refundPaymentPage);

// Helper function to process UPI refund
async function processUPIRefund(order, amount) {
  // This would integrate with actual UPI payment gateway
  // For now, we'll simulate the process
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'UPI refund processed successfully',
        refundId: `UPI_REF_${Date.now()}`
      });
    }, 1000);
  });
}

// @route   GET /api/admin/menu
// @desc    Get all menu items for admin management
// @access  Private/Admin
router.get('/menu', protect, isAdmin, allMenuBodyReq, allMenuPage);

// @route   POST /api/admin/menu
// @desc    Create a new menu item
// @access  Private/Admin
router.post('/menu', protect, isAdmin, upload.single('image'), createNewMenuBodyReq, createNewMenuPage);

// @route   PUT /api/admin/menu/:id
// @desc    Update a menu item
// @access  Private/Admin
router.put('/menu/:id', protect, isAdmin, upload.single('image'), updateMenuBodyReq, updateMenuPage);

// @route   DELETE /api/admin/menu/:id
// @desc    Delete a menu item
// @access  Private/Admin
router.delete('/menu/:id', protect, isAdmin, deleteMenuPage);

// @route   GET /api/admin/menu/categories
// @desc    Get all menu categories
// @access  Private/Admin
router.get('/menu/categories', protect, isAdmin, categoriesPage);

// @route   POST /api/admin/test-notification
// @desc    Test admin notification (for debugging)
// @access  Private/Admin
router.post('/test-notification', protect, isAdmin, testNotificationPage);

// @route   GET /api/admin/notifications
// @desc    Get admin notifications
// @access  Private/Admin
router.get('/notifications', protect, isAdmin, notificationBodyReq, notificationPage);

// @route   PUT /api/admin/notifications/:id/read
// @desc    Mark admin notification as read
// @access  Private/Admin
router.put('/notifications/:id/read', protect, isAdmin, readMarkNotificationPage);

// @route   PUT /api/admin/notifications/read-all
// @desc    Mark all admin notifications as read
// @access  Private/Admin
router.put('/notifications/read-all', protect, isAdmin, allReadMarkNotificationPage);

// @route   DELETE /api/admin/notifications/clear-all
// @desc    Clear all admin notifications
// @access  Private/Admin
router.delete('/notifications/clear-all', protect, isAdmin, allDeleteNotificationPage);

// @route   DELETE /api/admin/notifications/:id
// @desc    Delete admin notification
// @access  Private/Admin
router.delete('/notifications/:id', protect, isAdmin, singleNotificationDeletePage);

// @route   GET /api/admin/notification-sound
// @desc    Get admin notification sound preferences
// @access  Private/Admin
router.get('/notification-sound', protect, isAdmin, soundNotificationPage);

// @route   PUT /api/admin/notification-sound
// @desc    Update admin notification sound preferences
// @access  Private/Admin
router.put('/notification-sound', protect, isAdmin, updateNotificationSoundBodyReq, updateNotificationSoundPage);

// @route   POST /api/admin/test-user-notification
// @desc    Test user notification (for debugging)
// @access  Private/Admin
router.post('/test-user-notification', protect, isAdmin, updateUserNotificationBodyReq, updateUserNotificationPage);

// @route   POST /api/admin/users
// @desc    Create a new delivery agent or admin (Admin only)
// @access  Private/Admin
router.post('/users', protect, isAdmin, newUserBodyReq, newUserPage);

module.exports = router; 