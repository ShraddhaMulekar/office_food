const logoutPage = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

module.exports = { logoutPage };
