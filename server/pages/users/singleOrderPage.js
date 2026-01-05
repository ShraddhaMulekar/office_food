const singleOrderPage = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate('items.dish', 'name image description')
    .populate('deliveryStaff', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get user order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user order'
    });
  }
}
module.exports = { singleOrderPage };