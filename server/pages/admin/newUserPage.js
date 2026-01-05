const newUserPage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    const { name, email, phone, password, role } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      isActive: true
    });
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
}
module.exports = { newUserPage };