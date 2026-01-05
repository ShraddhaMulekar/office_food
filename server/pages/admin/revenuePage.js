const revenuePage = async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let groupBy = {};
    switch (period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'weekly':
        groupBy = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
        break;
      case 'monthly':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
    }

    const revenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'delivered' } },
      { $group: { _id: groupBy, revenue: { $sum: '$finalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        days: parseInt(days),
        revenueData
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching revenue analytics'
    });
  }
}
module.exports = { revenuePage };