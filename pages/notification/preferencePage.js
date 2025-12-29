const preferencePage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences');

    res.json({
      success: true,
      data: {
        preferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification preferences'
    });
  }
}
module.exports = preferencePage;