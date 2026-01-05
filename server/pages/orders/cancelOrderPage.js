const cancelOrderPage = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to cancel this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in its current status'
      });
    }

    // Cancel order
    await order.updateStatus('cancelled', req.user.role);
    if (reason) {
      order.cancellationReason = reason;
      await order.save();
    }

    // Create notification
    await Notification.createOrderNotification(
      order.user._id,
      order._id,
      order.orderNumber,
      'order_cancelled',
      { reason }
    );

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${order.user._id}`).emit('orderUpdate', {
      type: 'order_cancelled',
      order: order
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling order'
    });
  }
}
module.exports = { cancelOrderPage };