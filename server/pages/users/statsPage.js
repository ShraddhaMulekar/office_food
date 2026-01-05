const statPage = async (req, res) => {
  try {
    // Get order statistics
    const totalOrders = await Order.countDocuments({ user: req.user._id });
    const deliveredOrders = await Order.countDocuments({ 
      user: req.user._id, 
      status: 'delivered' 
    });
    const pendingOrders = await Order.countDocuments({ 
      user: req.user._id, 
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } 
    });

    // Get total spent
    const totalSpent = await Order.aggregate([
      { $match: { user: req.user._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    // Get favorite dishes
    const favoriteDishes = await Order.aggregate([
      { $match: { user: req.user._id, status: 'delivered' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { user: req.user._id, status: 'delivered' } },
      { $group: { _id: null, avg: { $avg: '$finalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          pending: pendingOrders
        },
        spending: {
          total: totalSpent.length > 0 ? totalSpent[0].total : 0,
          average: avgOrderValue.length > 0 ? Math.round(avgOrderValue[0].avg) : 0
        },
        favoriteDishes
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
}
module.exports = { statPage };