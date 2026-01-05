const { validationResult } = require("express-validator");

const refundPaymentPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { orderId, amount, reason } = req.body;

    const order = await Order.findById(orderId)
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order payment is not completed'
      });
    }

    if (amount > order.finalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order amount'
      });
    }

    // Process refund based on payment method
    let refundResult = { success: false, message: '' };

    if (order.paymentMethod === 'upi') {
      // Simulate UPI refund
      refundResult = await processUPIRefund(order, amount);
    } else if (order.paymentMethod === 'cod') {
      // COD orders don't need refund processing
      refundResult = { success: true, message: 'COD order - no refund processing needed' };
    } else {
      refundResult = { success: true, message: 'Refund processed successfully' };
    }

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message
      });
    }

    // Update order payment status
    order.paymentStatus = 'refunded';
    order.refundDetails = {
      amount,
      reason,
      processedBy: req.user._id,
      processedAt: new Date(),
      refundId: `REF_${Date.now()}`
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
    io.to(`user-${order.user._id}`).emit('refundProcessed', {
      order: order,
      refundAmount: amount
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        order,
        refundDetails: order.refundDetails
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund'
    });
  }
}
module.exports = { refundPaymentPage };