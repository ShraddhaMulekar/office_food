const deliveryStaffPage = async (req, res) => {
  try {
    const deliveryStaff = await User.find({
      role: 'delivery',
      isActive: true
    }).select('name phone isAvailable currentLocation');

    res.json({
      success: true,
      data: deliveryStaff
    });
  } catch (error) {
    console.error('Get delivery staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery staff'
    });
  }
}
module.exports = deliveryStaffPage;