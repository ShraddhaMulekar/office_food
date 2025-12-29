const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./db')
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
app.use(express.json())
app.use(cors())

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users')
const menuRoutes = require('./routes/menu')
const orderRoutes = require('./routes/orders')
const deliveryRoutes = require('./routes/delivery')

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);


// 404 handler
app.use(/.*/, (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  connectDB()
})