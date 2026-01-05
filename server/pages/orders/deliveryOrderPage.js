const { validationResult } = require("express-validator");

const deliveryOrderPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { deliveryStaffId } = req.body;

    // Check if delivery staff exists and is available
    const deliveryStaff = await User.findById(deliveryStaffId);
    if (!deliveryStaff || deliveryStaff.role !== 'delivery') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery staff'
      });
    }

    if (!deliveryStaff.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Delivery staff is not available'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Assign delivery staff
    await order.assignDeliveryStaff(deliveryStaffId);

    // Create notification for delivery staff
    await Notification.createDeliveryNotification(
      deliveryStaffId,
      order.orderNumber,
      {
        name: order.user.name,
        floor: order.user.floor,
        deskNumber: order.user.deskNumber
      }
    );

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`delivery-${deliveryStaffId}`).emit('newDeliveryAssignment', {
      order: order
    });

    res.json({
      success: true,
      message: 'Delivery staff assigned successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Assign delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning delivery staff'
    });
  }
}
module.exports = { deliveryOrderPage };