const updateDishPage = async (req, res) => {
  try {
    const dish = await Menu.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    const updateData = { ...req.body };

    if (req.file) {
      if (dish.image && dish.image !== '/uploads/menu/default.jpg') {
        const oldImagePath = path.join(__dirname, '..', dish.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/menu/${req.file.filename}`;
    }

    const updatedDish = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Dish updated successfully',
      data: { dish: updatedDish }
    });
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating dish'
    });
  }
}
module.exports = updateDishPage;