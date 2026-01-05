const { validationResult } = require("express-validator");

const rateOrderPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { rating, feedback } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to rate this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this order'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    // Check if already rated
    if (order.rating.stars) {
      return res.status(400).json({
        success: false,
        message: 'Order already rated'
      });
    }

    // Add rating
    await order.addRating(rating, feedback);

    // Update dish ratings
    for (const item of order.items) {
      const dish = await Menu.findById(item.dish);
      if (dish) {
        await dish.updateRating(rating);
      }
    }

    res.json({
      success: true,
      message: 'Order rated successfully',
      data: { rating: order.rating }
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rating order'
    });
  }
}
module.exports = { rateOrderPage };