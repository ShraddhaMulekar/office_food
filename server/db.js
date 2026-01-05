const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    // ✅ FIXED: Removed deprecated useNewUrlParser and useUnifiedTopology
    // These options are no longer supported in Mongoose 9.x
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 45000, // 45 seconds
    })

    console.log('✅ MongoDB connected successfully')
    console.log(`Connected to: ${conn.connection.host}`)
    
    return conn
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    
    // Exit process if connection fails
    process.exit(1)
  }
}

// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error after initial connection:', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected')
})

module.exports = connectDB