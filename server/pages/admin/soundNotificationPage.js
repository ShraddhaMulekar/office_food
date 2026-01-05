const soundNotificationPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences.sound');
    
    res.json({
      success: true,
      data: {
        soundPreferences: user.notificationPreferences.sound
      }
    });
  } catch (error) {
    console.error('Get notification sound preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sound preferences'
    });
  }
}
module.exports = { soundNotificationPage };