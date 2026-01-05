const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'employee' },
  phone: { type: String, required: true },
  department: String,
  floor: String,
  deskNumber: String,
  lastLogin: Date
}, { timestamps: true });

/* ✅ HASH PASSWORD (ONLY HERE) */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ✅ PASSWORD COMPARE */
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/* ✅ PUBLIC PROFILE */
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);