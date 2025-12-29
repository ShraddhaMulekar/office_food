const deleteNotificationPage = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id });

    res.json({
      success: true,
      message: 'All notifications cleared',
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing notifications'
    });
  }
}
module.exports = deleteNotificationPage;