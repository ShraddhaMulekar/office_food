const menuAdminPage = async (req, res) => {
  try {
    // Get total dishes
    const totalDishes = await Menu.countDocuments();
    const availableDishes = await Menu.countDocuments({ isAvailable: true });
    const featuredDishes = await Menu.countDocuments({ featured: true });

    // Get category distribution
    const categoryStats = await Menu.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get top rated dishes
    const topRatedDishes = await Menu.find({ 'rating.count': { $gt: 0 } })
      .sort({ 'rating.average': -1 })
      .limit(5)
      .select('name rating average');

    // Get dishes with low stock (if daily limit is set)
    const lowStockDishes = await Menu.find({
      dailyLimit: { $exists: true, $ne: null },
      $expr: { $gte: ['$soldToday', '$dailyLimit'] }
    }).select('name soldToday dailyLimit');

    res.json({
      success: true,
      data: {
        totalDishes,
        availableDishes,
        featuredDishes,
        categoryStats,
        topRatedDishes,
        lowStockDishes
      }
    });
  } catch (error) {
    console.error('Get menu stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu statistics'
    });
  }
}
module.exports = menuAdminPage;