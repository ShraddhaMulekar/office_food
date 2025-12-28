const logoutPage = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can update last login time or add to a blacklist if needed
    
    res.json({
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
}
module.exports = { logoutPage };