const getNotificationPage = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;

    let query = { recipient: req.user._id };
    if (unread !== undefined) {
      query.isRead = unread === 'true' ? false : true;
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('data.orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
}
module.exports = getNotificationPage;