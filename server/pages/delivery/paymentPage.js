const paymentPage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof image is required'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is assigned to this delivery agent
    if (order.deliveryStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this order'
      });
    }

    // Check if order is in delivering status
    if (order.status !== 'delivering') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in delivering status'
      });
    }

    // Check if payment method is COD
    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({
        success: false,
        message: 'Payment proof is only required for COD orders'
      });
    }

    // Generate the URL for the uploaded payment proof
    const paymentProofUrl = `/uploads/payments/${req.file.filename}`;

    // Update order with payment proof and mark as delivered
    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.paymentProof = paymentProofUrl;
    order.paymentStatus = 'completed';
    await order.save();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.user}`).emit('orderUpdate', {
        orderId: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus
      });
    }

    res.json({
      success: true,
      message: 'Payment proof uploaded and order marked as delivered successfully',
      data: { 
        order,
        paymentProof: paymentProofUrl
      }
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading payment proof'
    });
  }
}
module.exports = paymentPage;