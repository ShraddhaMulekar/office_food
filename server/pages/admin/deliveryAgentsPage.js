const deliveryAgentPage = async (req, res) => {
  try {
    const deliveryAgents = await User.find({
      role: 'delivery',
      isActive: true
    }).select('name phone isAvailable currentLocation');

    res.json({
      success: true,
      data: { deliveryAgents }
    });
  } catch (error) {
    console.error('Get delivery agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery agents'
    });
  }
}
module.exports = deliveryAgentPage;