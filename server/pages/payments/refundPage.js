const { validationResult } = require("express-validator");

const refundPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if Razorpay is initialized
    if (!razorpay) {      
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.'
      });
    }

    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order payment not completed'
      });
    }

    if (!order.paymentDetails.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No Razorpay payment ID found'
      });
    }

    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(order.paymentDetails.razorpayPaymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      notes: {
        reason: reason,
        refundedBy: req.user._id.toString()
      }
    });

    // Update order with refund details
    order.paymentDetails = {
      ...order.paymentDetails,
      refundId: refund.id,
      refundAmount: amount,
      refundReason: reason,
      refundStatus: 'processed',
      refundTime: new Date(),
      refundedBy: req.user._id
    };
    await order.save();

    // Create notification
    await Notification.createPaymentNotification(
      order.user._id,
      order.orderNumber,
      'refund_processed',
      amount
    );

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${order.user._id}`).emit('paymentUpdate', {
      type: 'refund_processed',
      order: order
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        order,
        refund: refund
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund'
    });
  }
}
module.exports = refundPage;