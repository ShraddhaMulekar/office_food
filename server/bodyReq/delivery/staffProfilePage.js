const staffProfilePage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get delivery profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery profile'
    });
  }
}
module.exports = staffProfilePage;