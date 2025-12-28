const forgotPasswordPage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now reset your password.',
      data: {
        email
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
}
module.exports = { forgotPasswordPage };