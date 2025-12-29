const { validationResult } = require("express-validator");

const updatePreferencePage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, sms, push, sound } = req.body;

    const updateData = {};
    if (email !== undefined) updateData['notificationPreferences.email'] = email;
    if (sms !== undefined) updateData['notificationPreferences.sms'] = sms;
    if (push !== undefined) updateData['notificationPreferences.push'] = push;
    if (sound) {
      if (sound.enabled !== undefined) updateData['notificationPreferences.sound.enabled'] = sound.enabled;
      if (sound.type !== undefined) updateData['notificationPreferences.sound.type'] = sound.type;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification preferences'
    });
  }
}
module.exports = { updatePreferencePage };