const User = require('../../models/User');

const profilePage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

module.exports = { profilePage };