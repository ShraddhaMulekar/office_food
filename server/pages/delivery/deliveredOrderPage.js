const deliveredOrderPage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is assigned to this delivery agent
    if (order.deliveryStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this order'
      });
    }

    // Check if order is in delivering status
    if (order.status !== 'delivering') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in delivering status'
      });
    }

    // Check if payment method is COD - require payment proof upload
    if (order.paymentMethod === 'cod') {
      return res.status(400).json({
        success: false,
        message: 'COD orders require payment proof upload. Please use the payment proof upload endpoint.',
        requiresPaymentProof: true
      });
    }

    // Update order status
    order.status = 'delivered';
    order.deliveredAt = new Date();
    await order.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.user}`).emit('orderUpdate', {
        orderId: order._id,
        status: order.status
      });
    }

    res.json({
      success: true,
      message: 'Order marked as delivered successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Mark as delivered error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking order as delivered'
    });
  }
}
module.exports = deliveredOrderPage;