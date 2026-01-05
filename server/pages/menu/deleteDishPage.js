const deleteDishPage = async (req, res) => {
  try {
    const dish = await Menu.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    if (dish.image && dish.image !== '/uploads/menu/default.jpg') {
      const imagePath = path.join(__dirname, '..', dish.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Menu.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting dish'
    });
  }
}
module.exports = deleteDishPage;