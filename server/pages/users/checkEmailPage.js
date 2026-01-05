const checkEmailPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const existingUser = await User.findByEmail(email);

    res.json({
      success: true,
      data: {
        exists: !!existingUser,
        available: !existingUser
      }
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking email'
    });
  }
}
module.exports = { checkEmailPage };