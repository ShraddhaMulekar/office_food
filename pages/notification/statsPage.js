const statsPage = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

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

    // Get notification counts by type
    const typeStats = await Notification.aggregate([
      { $match: { recipient: req.user._id, createdAt: dateFilter } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get read vs unread stats
    const readStats = await Notification.aggregate([
      { $match: { recipient: req.user._id, createdAt: dateFilter } },
      { $group: { _id: '$isRead', count: { $sum: 1 } } }
    ]);

    // Get channel delivery stats
    const channelStats = await Notification.aggregate([
      { $match: { recipient: req.user._id, createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          emailSent: { $sum: { $cond: ['$sentChannels.email', 1, 0] } },
          smsSent: { $sum: { $cond: ['$sentChannels.sms', 1, 0] } },
          pushSent: { $sum: { $cond: ['$sentChannels.push', 1, 0] } },
          inAppSent: { $sum: { $cond: ['$sentChannels.inApp', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        typeStats,
        readStats,
        channelStats: channelStats[0] || {
          emailSent: 0,
          smsSent: 0,
          pushSent: 0,
          inAppSent: 0
        }
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification statistics'
    });
  }
}
module.exports = { statsPage };