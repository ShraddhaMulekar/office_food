const { validationResult } = require("express-validator");

const createNewMenuPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const menuData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Handle image upload
    if (req.file) {
      menuData.image = `${req.protocol}://${req.get('host')}/uploads/menu/${req.file.filename}`;
    } else if (req.body.image) {
      menuData.image = req.body.image;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Dish image is required'
      });
    }

    // Convert category to lowercase to match enum
    if (req.body.category) {
      menuData.category = req.body.category.toLowerCase();
    }

    // Process allergens - convert comma-separated string to array and filter out empty values
    if (req.body.allergens) {
      const allergensArray = req.body.allergens
        .split(',')
        .map(allergen => allergen.trim().toLowerCase())
        .filter(allergen => allergen && ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish', 'fish', 'wheat'].includes(allergen));
      menuData.allergens = allergensArray;
    } else {
      menuData.allergens = []; // Set empty array if no allergens
    }

    // Convert string values to boolean
    if (req.body.isVegetarian !== undefined) {
      menuData.isVegetarian = req.body.isVegetarian === 'true' || req.body.isVegetarian === true;
    }
    if (req.body.isSpicy !== undefined) {
      menuData.isSpicy = req.body.isSpicy === 'true' || req.body.isSpicy === true;
    }
    if (req.body.isAvailable !== undefined) {
      menuData.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
    }
    if (req.body.featured !== undefined) {
      menuData.featured = req.body.featured === 'true' || req.body.featured === true;
    }

    // Convert numeric fields
    if (req.body.price) {
      menuData.price = parseFloat(req.body.price);
    }
    if (req.body.preparationTime) {
      menuData.preparationTime = parseInt(req.body.preparationTime);
    }
    if (req.body.calories) {
      menuData.calories = parseInt(req.body.calories);
    }

    const menuItem = new Menu(menuData);
    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { menuItem }
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating menu item'
    });
  }
}
module.exports = { createNewMenuPage };