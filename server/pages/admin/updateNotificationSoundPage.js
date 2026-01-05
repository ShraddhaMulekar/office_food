const { validationResult } = require("express-validator");

const updateNotificationSoundPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { enabled, type } = req.body;
    const updateData = {};

    if (enabled !== undefined) {
      updateData['notificationPreferences.sound.enabled'] = enabled;
    }
    if (type !== undefined) {
      updateData['notificationPreferences.sound.type'] = type;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('notificationPreferences.sound');

    res.json({
      success: true,
      message: 'Notification sound preferences updated successfully',
      data: {
        soundPreferences: user.notificationPreferences.sound
      }
    });
  } catch (error) {
    console.error('Update notification sound preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating sound preferences'
    });
  }
}
module.exports = { updateNotificationSoundPage };