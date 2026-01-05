const dashboardPage = async (req, res) => {
  try {
    // Get ready orders (status: confirmed)
    const confirmedOrders = await Order.find({ 
      status: 'confirmed',
      deliveryStaff: { $exists: false }
    })
    .populate('user', 'name phone')
    .populate('items.dish', 'name image')
    .sort({ createdAt: 1 })
    .limit(10);

    // Get delivering orders (status: delivering)
    const deliveringOrders = await Order.find({
      deliveryStaff: req.user._id,
      status: 'delivering'
    })
    .populate('user', 'name phone floor deskNumber')
    .populate('items.dish', 'name image')
    .sort({ createdAt: 1 });

    // Transform orders to include deliveryAddress field
    const transformOrder = (order) => {
      const orderObj = order.toObject();
      orderObj.deliveryAddress = order.deliveryDetails.address;
      orderObj.total = order.finalAmount; // Use finalAmount as total
      return orderObj;
    };

    const transformedReadyOrders = confirmedOrders.map(transformOrder);
    const transformedDeliveringOrders = deliveringOrders.map(transformOrder);

    // Get completed orders today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = await Order.countDocuments({
      deliveryStaff: req.user._id,
      status: 'delivered',
      actualDeliveryTime: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Calculate today's earnings
    const deliveredOrdersToday = await Order.find({
      deliveryStaff: req.user._id,
      status: 'delivered',
      actualDeliveryTime: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const todayEarnings = deliveredOrdersToday.reduce((total, order) => {
      return total + (order.finalAmount || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        readyOrders: transformedReadyOrders,
        deliveringOrders: transformedDeliveringOrders,
        completedToday,
        todayEarnings
      }
    });
  } catch (error) {
    console.error('Get delivery dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery dashboard data'
    });
  }
}
module.exports = dashboardPage;