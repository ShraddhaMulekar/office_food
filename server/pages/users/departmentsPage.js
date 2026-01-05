const departmentsPage = async (req, res) => {
  try {
    const departments = await User.distinct('department', { 
      department: { $exists: true, $ne: null, $ne: '' } 
    });

    res.json({
      success: true,
      data: { departments }
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching departments'
    });
  }
}
module.exports = { departmentsPage };