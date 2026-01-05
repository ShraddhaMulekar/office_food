const { validationResult } = require("express-validator");

const updateOrderPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { status, notes } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('deliveryStaff', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if delivery staff is authorized to update this order
    if (req.user.role === 'delivery' && 
        order.deliveryStaff?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update order status
    await order.updateStatus(status, req.user.role);

    // Add notes if provided
    if (notes) {
      order.notes = notes;
      await order.save();
    }

    // Create notification
    await Notification.createOrderNotification(
      order.user._id,
      order._id,
      order.orderNumber,
      status,
      { notes }
    );

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${order.user._id}`).emit('orderUpdate', {
      type: status,
      order: order
    });

    // Also emit orderStatusUpdate for consistency
    io.to(`user-${order.user._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: status,
      order: order
    });

    // Notify delivery staff if assigned
    if (order.deliveryStaff) {
      io.to(`delivery-${order.deliveryStaff._id}`).emit('orderUpdate', {
        type: status,
        order: order
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
}
module.exports = { updateOrderPage };