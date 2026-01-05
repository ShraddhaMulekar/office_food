const { validationResult } = require("express-validator");

const broadcastPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, message, type = 'system_announcement', recipients = 'all' } = req.body;

    // Get users based on recipients filter
    let userQuery = {};
    if (recipients === 'employees') {
      userQuery.role = 'employee';
    } else if (recipients === 'delivery') {
      userQuery.role = 'delivery';
    }

    const users = await User.find(userQuery).select('_id');

    // Create notifications for all users
    const notifications = users.map(user => ({
      recipient: user._id,
      type,
      title,
      message,
      channels: {
        inApp: true,
        email: true,
        sms: false,
        push: true
      }
    }));

    await Notification.insertMany(notifications);

    // Emit real-time notifications
    const io = req.app.get('io');
    users.forEach(user => {
      io.to(`user-${user._id}`).emit('broadcastNotification', {
        title,
        message,
        type
      });
    });

    res.json({
      success: true,
      message: `Broadcast notification sent to ${users.length} users`,
      data: { sentCount: users.length }
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending broadcast notification'
    });
  }
}
module.exports = { broadcastPage };