const { validationResult } = require("express-validator");

const updateStatusOrderPage = async (req, res) => {
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

    // Check if order is assigned to this delivery staff
    if (order.deliveryStaff._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Check if order is in delivering status
    if (order.status !== 'delivering') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in delivering status'
      });
    }

    // Update order status
    await order.updateStatus(status, 'delivery');

    // Add notes if provided
    if (notes) {
      order.notes = notes;
      await order.save();
    }

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${order.user._id}`).emit('orderUpdate', {
      type: status,
      order: order
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update delivery order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
}
module.exports = { updateStatusOrderPage };