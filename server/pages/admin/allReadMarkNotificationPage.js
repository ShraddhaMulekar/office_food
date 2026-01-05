const allReadMarkNotificationPage = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark all admin notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read'
    });
  }
}
module.exports = { allReadMarkNotificationPage };