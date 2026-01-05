const adminDashboardPage = async (req, res) => {
  try {
    const { period = 'all' } = req.query;

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
      case 'year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1)
        };
        break;
      case 'all':
      default:
        dateFilter = {}; // No date filter for all-time
        break;
    }

    // Get order statistics
    const orderQuery = dateFilter && Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const totalOrders = await Order.countDocuments(orderQuery);
    const deliveredOrders = await Order.countDocuments({ 
      ...orderQuery,
      status: 'delivered'
    });
    const pendingOrders = await Order.countDocuments({ 
      ...orderQuery,
      status: { $in: ['pending', 'confirmed', 'delivering'] }
    });
    const cancelledOrders = await Order.countDocuments({ 
      ...orderQuery,
      status: 'cancelled'
    });

    // Get revenue statistics
    const revenueMatch = dateFilter && Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter, status: 'delivered' }
      : { status: 'delivered' };
    const revenueData = await Order.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get payment method statistics
    const paymentMatch = dateFilter && Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const paymentStats = await Order.aggregate([
      { $match: paymentMatch },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
    ]);

    // Get top selling dishes
    const dishesMatch = dateFilter && Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter, status: 'delivered' }
      : { status: 'delivered' };
    const topDishes = await Order.aggregate([
      { $match: dishesMatch },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Get delivery staff performance
    const deliveryMatch = dateFilter && Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter, status: 'delivered' }
      : { status: 'delivered' };
    const deliveryPerformance = await Order.aggregate([
      { $match: deliveryMatch },
      { $group: { _id: '$deliveryStaff', deliveredCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'deliveryStaff' } },
      { $unwind: '$deliveryStaff' },
      { $project: { name: '$deliveryStaff.name', deliveredCount: 1 } },
      { $sort: { deliveredCount: -1 } },
      { $limit: 5 }
    ]);

    // Get user statistics
    const totalUsers = await User.countDocuments({ role: 'employee' });
    const activeUsers = await User.countDocuments({ role: 'employee', isActive: true });
    const deliveryStaff = await User.countDocuments({ role: 'delivery' });

    // Get recent orders
    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get order status distribution
    const orderStatusDistribution = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    // Get average rating from all rated orders
    const ratingStats = await Order.aggregate([
      { $match: { 'rating.stars': { $exists: true, $ne: null, $gt: 0 } } },
      { 
        $group: { 
          _id: null, 
          averageRating: { $avg: '$rating.stars' },
          ratingCount: { $sum: 1 }
        } 
      }
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
    const ratingCount = ratingStats.length > 0 ? ratingStats[0].ratingCount : 0;

    res.json({
      success: true,
      data: {
        period,
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          deliveryRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0
        },
        revenue: {
          total: totalRevenue,
          averageOrderValue: deliveredOrders > 0 ? Math.round(totalRevenue / deliveredOrders) : 0
        },
        payments: paymentStats,
        topDishes,
        deliveryPerformance,
        users: {
          total: totalUsers,
          active: activeUsers,
          deliveryStaff
        },
        recentOrders,
        orderStatusDistribution,
        averageRating,
        ratingCount
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
}
module.exports = adminDashboardPage;