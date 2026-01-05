const { generateToken } = require('../../utils/auth');

const refreshPage = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const token = generateToken(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while refreshing token'
    });
  }
};

module.exports = { refreshPage };