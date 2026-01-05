const updateOrderStatusPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const { status, notes, deliveryAgentId } = req.body;

    // Update order status
    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    // Auto-assign delivery agent when status is confirmed
    if (status === 'confirmed') {
      // If delivery agent is manually specified, use that
      if (deliveryAgentId && deliveryAgentId.trim() !== '') {
        const deliveryAgent = await User.findById(deliveryAgentId);
        if (!deliveryAgent || deliveryAgent.role !== 'delivery') {
          return res.status(400).json({
            success: false,
            message: 'Invalid delivery agent'
          });
        }
        order.deliveryStaff = deliveryAgentId;
      } else {
        // Auto-assign to available delivery agent
        const availableDeliveryAgent = await User.findOne({
          role: 'delivery',
          isActive: true,
          isAvailable: true
        });
        
        if (availableDeliveryAgent) {
          order.deliveryStaff = availableDeliveryAgent._id;
        }
      }
      
      // Automatically update status to delivering if delivery agent is assigned
      if (order.deliveryStaff) {
        order.status = 'delivering';
      }
    }

    // Set delivered time if status is delivered
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Populate order with user and delivery staff info for response and socket events
    await order.populate('user', 'name email phone');
    await order.populate('deliveryStaff', 'name phone');

    // Create notification for user
    try {
      await Notification.createOrderNotification(
        order.user._id,
        order._id,
        order.orderNumber,
        order.status,
        {
          amount: order.finalAmount,
          floor: order.deliveryDetails?.floor,
          deskNumber: order.deliveryDetails?.deskNumber
        }
      );
    } catch (notificationError) {
      console.error('Failed to create user notification:', notificationError);
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Admin order status update: Emitting to user room:', `user-${order.user._id}`);
      console.log('Admin order status update: Order data:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        userId: order.user._id,
        userName: order.user.name
      });
      
      // Emit orderUpdate event with correct format for user notifications
      io.to(`user-${order.user._id}`).emit('orderUpdate', {
        type: order.status,
        order: order
      });
      
      // Also emit orderStatusUpdate for consistency
      io.to(`user-${order.user._id}`).emit('orderStatusUpdate', {
        orderId: order._id,
        status: order.status,
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
module.exports = updateOrderStatusPage;