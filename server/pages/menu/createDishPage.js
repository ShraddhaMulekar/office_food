const createDishPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dish image is required'
      });
    }

    const dishData = {
      ...req.body,
      image: `/uploads/menu/${req.file.filename}`,
      createdBy: req.user._id
    };

    const dish = await Menu.create(dishData);

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      data: { dish }
    });
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating dish'
    });
  }
}
module.exports = { createDishPage };