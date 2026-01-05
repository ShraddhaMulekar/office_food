const paymentPage = async (req, res) => {
  try {
    const { search, paymentStatus, paymentMethod, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    let query = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    let ordersQuery = Order.find(query)
      .populate('user', 'name email phone')
      .populate('deliveryStaff', 'name phone')
      .sort({ createdAt: -1 });

    if (search) {
      ordersQuery = ordersQuery.or([
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ]);
    }

    const payments = await ordersQuery.skip(skip).limit(parseInt(limit));
    const total = await Order.countDocuments(query);

    // Calculate summary statistics
    const summary = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        payments,
        summary: summary[0] || {
          totalRevenue: 0,
          pendingCount: 0,
          completedCount: 0,
          failedCount: 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments'
    });
  }
}
module.exports = paymentPage;