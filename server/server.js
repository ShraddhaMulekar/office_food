const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./db')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')
const http = require('http')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4001

// CREATE HTTP SERVER FOR SOCKET.IO
const server = http.createServer(app)

// Initialize Socket.IO with the HTTP server
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://shreenathlunch.vercel.app/menu'
      : 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// CREATE UPLOADS DIRECTORIES IF NOT EXISTS
const uploadsDir = path.join(__dirname, 'uploads')
const paymentsDir = path.join(__dirname, 'uploads/payments')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('✅ Uploads directory created')
}
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true })
  console.log('✅ Payments directory created')
}

// VALIDATE REQUIRED ENVIRONMENT VARIABLES
const requiredEnvVars = [
  'MONGODB_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`)
  process.exit(1)
}

// MIDDLEWARE SETUP
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Trust proxy for rate limiting
app.set('trust proxy', 1)

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://shreenathlunch.vercel.app/menu' 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}))

// Security Middleware - Helmet
app.use(helmet({
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'http:', 'https:', '/uploads/'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      connectSrc: ["'self'", 'https:', 'wss:'],
      mediaSrc: ["'self'"],
    }
  }
}))

// Compression Middleware
app.use(compression())

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// RATE LIMITING - FIXED FOR IPv6
// Use the built-in key generator instead of custom one
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === 'development', // Skip in development
  message: 'Too many requests, please try again later.'
})

app.use('/api/', limiter)

// STATIC FILES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/uploads/payments', express.static(path.join(__dirname, 'uploads/payments')))

// IMPORT ROUTES
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const menuRoutes = require('./routes/menu')
const orderRoutes = require('./routes/orders')
const deliveryRoutes = require('./routes/delivery')
const adminRoutes = require('./routes/admin')
const paymentRoutes = require('./routes/payments')
const notificationRoutes = require('./routes/notifications')

// API ROUTES
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/delivery', deliveryRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// SOCKET.IO CONNECTION HANDLING
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id)

  // Join user to their personal room for notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`)
    console.log(`✅ User ${userId} joined their room`)
  })

  // Join delivery staff to their room
  socket.on('join-delivery', (deliveryId) => {
    socket.join(`delivery-${deliveryId}`)
    console.log(`✅ Delivery staff ${deliveryId} joined their room`)
  })

  // Join admin to admin room
  socket.on('join-admin', () => {
    socket.join('admin-room')
    console.log('✅ Admin joined admin room, socket ID:', socket.id)

    // Log admin room clients
    const adminRoom = io.sockets.adapter.rooms.get('admin-room')
    console.log('Admin room clients:', adminRoom ? adminRoom.size : 0)
  })

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)
  })

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

// Make io accessible to routes
app.set('io', io)

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  })
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// START SERVER FUNCTION
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB()
    console.log('✅ Database connected')

    // Listen on server (required for Socket.IO)
    server.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })

    // Handle port already in use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!\n`)
        console.error('Quick Fix - Try one of these:')
        console.error(`  • Kill process: taskkill /PID <process_id> /F (Windows)`)
        console.error(`  • Or change port in .env: PORT=5000`)
        console.error(`  • Or run: PORT=5000 npm start\n`)
        process.exit(1)
      } else {
        throw err
      }
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

// GRACEFUL SHUTDOWN HANDLING
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

// START THE SERVER
startServer()

module.exports = { app, server, io }