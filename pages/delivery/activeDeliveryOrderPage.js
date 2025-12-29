const activeDeliveryOrderPage = async (req, res) => {
  try {
    const activeStatuses = ['confirmed', 'delivering'];
    
    const orders = await Order.find({
      deliveryStaff: req.user._id,
      status: { $in: activeStatuses }
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

    const transformedOrders = orders.map(transformOrder);

    res.json({
      success: true,
      data: { orders: transformedOrders }
    });
  } catch (error) {
    console.error('Get active delivery orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active delivery orders'
    });
  }
}
module.exports = activeDeliveryOrderPage;