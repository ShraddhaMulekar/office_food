const ordersAnalyticsPage = async (req, res) => {
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

    const orderData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { date: groupBy, status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        days: parseInt(days),
        orderData
      }
    });
  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order analytics'
    });
  }
}
module.exports = { ordersAnalyticsPage };