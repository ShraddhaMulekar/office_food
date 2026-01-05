const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { protect, isAdmin } = require('../middleware/auth');
const { createOrderBodyReq } = require('../bodyReq/payments/create-order-body-req');
const { createOrderPage } = require('../pages/payments/createOrderPage');
const { verifyBodyReq } = require('../bodyReq/payments/verify-body-req');
const { verifyPage } = require('../pages/payments/verifyPage');
const refundBodyReq = require('../bodyReq/payments/refund-body-req');
const refundPage = require('../pages/payments/refundPage');
const getOrderPage = require('../pages/payments/getOrderPage');
const webhookPage = require('../pages/payments/webhookPage');

const router = express.Router();

// Initialize Razorpay only if credentials are available
let razorpay = null;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } else {
    console.log('Razorpay credentials not found. Payment features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Razorpay:', error.message);
}

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order for payment
// @access  Private
router.post('/create-order', protect, createOrderBodyReq, createOrderPage);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/verify', protect, verifyBodyReq, verifyPage);

// @route   POST /api/payments/refund
// @desc    Process refund for an order
// @access  Private/Admin
router.post('/refund', protect, isAdmin, refundBodyReq, refundPage);

// @route   GET /api/payments/order/:orderId
// @desc    Get payment details for an order
// @access  Private
router.get('/order/:orderId', protect, getOrderPage);

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), webhookPage);

// Webhook handlers
async function handlePaymentCaptured(payment) {
  try {
    const order = await Order.findOne({
      'paymentDetails.razorpayOrderId': payment.order_id
    });

    if (order && payment.status === 'captured') {
      order.paymentStatus = 'completed';
      order.paymentDetails = {
        ...order.paymentDetails,
        razorpayPaymentId: payment.id,
        paymentStatus: 'completed',
        paymentTime: new Date(),
        verified: true
      };
      await order.save();

      // Create notification
      await Notification.createPaymentNotification(
        order.user,
        order.orderNumber,
        'payment_success',
        order.finalAmount
      );
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
}

async function handleRefundProcessed(refund) {
  try {
    const order = await Order.findOne({
      'paymentDetails.razorpayPaymentId': refund.payment_id
    });

    if (order) {
      order.paymentDetails = {
        ...order.paymentDetails,
        refundId: refund.id,
        refundAmount: refund.amount / 100, // Convert from paise
        refundStatus: 'processed',
        refundTime: new Date()
      };
      await order.save();

      // Create notification
      await Notification.createPaymentNotification(
        order.user,
        order.orderNumber,
        'refund_processed',
        refund.amount / 100
      );
    }
  } catch (error) {
    console.error('Handle refund processed error:', error);
  }
}

module.exports = router; 