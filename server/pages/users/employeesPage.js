const employeesPage = async (req, res) => {
  try {
    const { search, department, isActive, page = 1, limit = 20 } = req.query;

    let query = { role: 'employee' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const employees = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employees'
    });
  }
}
module.exports = employeesPage;