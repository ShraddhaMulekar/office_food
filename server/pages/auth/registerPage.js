const { validationResult } = require('express-validator');
const User = require('../../models/User');
const { generateToken } = require('../../utils/auth');

const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, department, floor, deskNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    /* ✅ CREATE USER (PLAIN PASSWORD) */
    const user = await User.create({
      name,
      email,
      password,   // 👈 plain password
      phone,
      department,
      floor,
      deskNumber,
      lastLogin: new Date()
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: user.getPublicProfile(),
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { registerUser };