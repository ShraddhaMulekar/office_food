const { validationResult } = require("express-validator");

const updateMenuPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const updateData = { ...req.body };

    // Handle image upload
    if (req.file) {
      updateData.image = `${req.protocol}://${req.get('host')}/uploads/menu/${req.file.filename}`;
    }

    // Convert category to lowercase to match enum
    if (req.body.category) {
      updateData.category = req.body.category.toLowerCase();
    }

    // Process allergens - convert comma-separated string to array and filter out empty values
    if (req.body.allergens !== undefined) {
      if (req.body.allergens) {
        const allergensArray = req.body.allergens
          .split(',')
          .map(allergen => allergen.trim().toLowerCase())
          .filter(allergen => allergen && ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish', 'wheat'].includes(allergen));
        updateData.allergens = allergensArray;
      } else {
        updateData.allergens = []; // Set empty array if no allergens
      }
    }

    // Convert string values to boolean
    if (req.body.isVegetarian !== undefined) {
      updateData.isVegetarian = req.body.isVegetarian === 'true' || req.body.isVegetarian === true;
    }
    if (req.body.isSpicy !== undefined) {
      updateData.isSpicy = req.body.isSpicy === 'true' || req.body.isSpicy === true;
    }
    if (req.body.isAvailable !== undefined) {
      updateData.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
    }
    if (req.body.featured !== undefined) {
      updateData.featured = req.body.featured === 'true' || req.body.featured === true;
    }

    // Convert numeric fields
    if (req.body.price) {
      updateData.price = parseFloat(req.body.price);
    }
    if (req.body.preparationTime) {
      updateData.preparationTime = parseInt(req.body.preparationTime);
    }
    if (req.body.calories) {
      updateData.calories = parseInt(req.body.calories);
    }

    const updatedMenuItem = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menuItem: updatedMenuItem }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating menu item'
    });
  }
}
module.exports = { updateMenuPage };