const dailyCountMenuPage = async (req, res) => {
  try {
    await Menu.resetDailyCounts();

    res.json({
      success: true,
      message: 'Daily counts reset successfully'
    });
  } catch (error) {
    console.error('Reset daily counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting daily counts'
    });
  }
}
module.exports = { dailyCountMenuPage };