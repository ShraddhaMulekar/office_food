const Menu = require('../../models/Menu');

const singleMenuPage = async (req, res) => {
  try {
    const dish = await Menu.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    res.json({
      success: true,
      data: { dish }
    });
  } catch (error) {
    console.error('Get dish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dish'
    });
  }
}
module.exports = { singleMenuPage };