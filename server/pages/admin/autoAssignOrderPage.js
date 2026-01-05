const autoAssignOrderPage = async (req, res) => {
  try {
    // Get all ready orders without delivery staff
    const readyOrders = await Order.find({
      status: 'ready',
      deliveryStaff: { $exists: false }
    }).populate('user', 'name');

    // Get available delivery staff (with less than 3 active orders)
    const deliveryStaff = await User.find({ 
      role: 'delivery', 
      isActive: true 
    });

    const deliveryStaffWithLoad = await Promise.all(
      deliveryStaff.map(async (staff) => {
        const activeOrders = await Order.countDocuments({
          deliveryStaff: staff._id,
          status: { $in: ['delivering', 'ready'] }
        });
        return { ...staff.toObject(), activeOrders };
      })
    );

    // Sort delivery staff by load (ascending)
    const availableStaff = deliveryStaffWithLoad
      .filter(staff => staff.activeOrders < 3)
      .sort((a, b) => a.activeOrders - b.activeOrders);

    let assignedCount = 0;

    for (const order of readyOrders) {
      if (availableStaff.length === 0) break;

      const selectedStaff = availableStaff[0];
      
      order.deliveryStaff = selectedStaff._id;
      order.status = 'delivering';
      order.assignedAt = new Date();
      await order.save();

      // Update staff load
      selectedStaff.activeOrders += 1;
      if (selectedStaff.activeOrders >= 3) {
        availableStaff.shift(); // Remove from available list
      }

      // Create notification
      await Notification.create({
        recipient: selectedStaff._id,
        type: 'order_assigned',
        title: 'New Order Assigned',
        message: `You have been assigned order #${order.orderNumber}`,
        data: { orderId: order._id }
      });

      // Emit real-time notification
      const io = req.app.get('io');
      io.to(`delivery-${selectedStaff._id}`).emit('orderAssigned', {
        order: order,
        message: `New order #${order.orderNumber} assigned to you`
      });

      assignedCount++;
    }

    res.json({
      success: true,
      message: `Auto-assigned ${assignedCount} orders to delivery staff`,
      data: { assignedCount, totalReady: readyOrders.length }
    });
  } catch (error) {
    console.error('Auto-assign orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while auto-assigning orders'
    });
  }
}
module.exports = { autoAssignOrderPage };