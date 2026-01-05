const { validationResult } = require("express-validator");

const allMenuPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      search,
      category,
      availability = 'all',
      sort = 'name',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (availability !== 'all') {
      query.isAvailable = availability === 'available';
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'name':
        sortObj = { name: 1 };
        break;
      case 'price':
        sortObj = { price: 1 };
        break;
      case 'createdAt':
        sortObj = { createdAt: -1 };
        break;
      case 'popularity':
        sortObj = { 'rating.count': -1 };
        break;
      default:
        sortObj = { name: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const menuItems = await Menu.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');

    const total = await Menu.countDocuments(query);

    res.json({
      success: true,
      data: {
        menuItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu items'
    });
  }
}
module.exports = allMenuPage;