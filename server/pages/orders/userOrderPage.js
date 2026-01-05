const userOrderPage = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = { user: req.user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user._id })
      .populate('deliveryStaff', 'name phone')
      .populate('items.dish', 'name image price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
}
module.exports = { userOrderPage };