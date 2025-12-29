const statusOrderPage = async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { $gte: weekStart };
        break;
      case 'month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        };
        break;
    }

    // Get delivered orders count
    const deliveredCount = await Order.countDocuments({
      deliveryStaff: req.user._id,
      status: 'delivered',
      actualDeliveryTime: dateFilter
    });

    // Get total orders count
    const totalOrders = await Order.countDocuments({
      deliveryStaff: req.user._id,
      actualDeliveryTime: dateFilter
    });

    // Get average delivery time
    const deliveredOrders = await Order.find({
      deliveryStaff: req.user._id,
      status: 'delivered',
      actualDeliveryTime: dateFilter
    }).select('createdAt actualDeliveryTime');

    let totalDeliveryTime = 0;
    let validDeliveries = 0;

    deliveredOrders.forEach(order => {
      if (order.actualDeliveryTime && order.createdAt) {
        const deliveryTime = order.actualDeliveryTime.getTime() - order.createdAt.getTime();
        totalDeliveryTime += deliveryTime;
        validDeliveries++;
      }
    });

    const averageDeliveryTime = validDeliveries > 0 ? totalDeliveryTime / validDeliveries : 0;

    // Get pending orders count
    const pendingCount = await Order.countDocuments({
      deliveryStaff: req.user._id,
      status: { $in: ['confirmed', 'delivering'] }
    });

    res.json({
      success: true,
      data: {
        period,
        stats: {
          totalOrders,
          deliveredOrders: deliveredCount,
          pendingOrders: pendingCount,
          averageDeliveryTimeMinutes: Math.round(averageDeliveryTime / (1000 * 60)),
          deliveryRate: totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get delivery stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery statistics'
    });
  }
}
module.exports = statusOrderPage;