const assignedOrderPage = async (req, res) => {
  try {
    const { status, paymentMethod, page = 1, limit = 20 } = req.query;

    let query = { deliveryStaff: req.user._id };
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('user', 'name phone floor deskNumber')
      .populate('items.dish', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

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
      data: {
        orders: transformedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery orders'
    });
  }
}
module.exports = assignedOrderPage;