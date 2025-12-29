const { validationResult } = require("express-validator");

const testPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { type } = req.body;

    // Create test notification
    const notification = await Notification.create({
      recipient: req.user._id,
      type: 'system_announcement',
      title: 'Test Notification',
      message: `This is a test ${type} notification to verify your settings.`,
      channels: {
        inApp: true,
        email: type === 'email',
        sms: type === 'sms',
        push: type === 'push'
      }
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(`user-${req.user._id}`).emit('testNotification', {
      type,
      notification
    });

    res.json({
      success: true,
      message: `Test ${type} notification sent successfully`,
      data: { notification }
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test notification'
    });
  }
}
module.exports = { testPage };