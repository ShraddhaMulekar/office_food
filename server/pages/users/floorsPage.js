const floorPage = async (req, res) => {
  try {
    const floors = await User.distinct('floor', { 
      floor: { $exists: true, $ne: null, $ne: '' } 
    });

    res.json({
      success: true,
      data: { floors }
    });
  } catch (error) {
    console.error('Get floors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching floors'
    });
  }
}
module.exports = { floorPage };