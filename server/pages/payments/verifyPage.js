const { validationResult } = require("express-validator");

const verifyPage = async (req, res) => {
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

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find order
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }

    // Update order payment status
    order.paymentStatus = 'completed';
    order.paymentDetails = {
      ...order.paymentDetails,
      razorpayPaymentId: razorpayPaymentId,
      paymentStatus: 'completed',
      paymentTime: new Date(),
      verified: true
    };
    await order.save();

    // Create notification
    await Notification.createPaymentNotification(
      order.user._id,
      order.orderNumber,
      'payment_success',
      order.finalAmount
    );

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${order.user._id}`).emit('paymentUpdate', {
      type: 'payment_success',
      order: order
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        order,
        paymentDetails: order.paymentDetails
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying payment'
    });
  }
}
module.exports = { verifyPage };