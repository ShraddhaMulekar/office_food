const { validationResult } = require("express-validator");

const availabilityPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { isAvailable, currentLocation } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        isAvailable,
        currentLocation: currentLocation || null
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        isAvailable: user.isAvailable,
        currentLocation: user.currentLocation
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating availability'
    });
  }
}
module.exports = { availabilityPage };