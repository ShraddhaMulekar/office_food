const categoriesPage = async (req, res) => {
  try {
    const categories = [
      { _id: 'breakfast', name: 'Breakfast' },
      { _id: 'lunch', name: 'Lunch' },
      { _id: 'dinner', name: 'Dinner' },
      { _id: 'snacks', name: 'Snacks' },
      { _id: 'beverages', name: 'Beverages' },
      { _id: 'desserts', name: 'Desserts' }
    ];

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
}
module.exports = { categoriesPage };