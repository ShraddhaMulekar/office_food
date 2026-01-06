🚀 Live Demo
https://shreenathlunch.vercel.app/menu

##Frontend##
✨ Features

📱 Responsive design for all devices
🍽️ Browse daily menu items
🛒 Add items to cart
👤 User authentication
📦 Order history tracking
💳 Multiple payment options
🔔 Real-time order status updates
🎨 Modern and intuitive UI

🛠️ Tech Stack

Framework: React
Routing: React Router Dom
State Management: Context API 
Styling: CSS Modules / Tailwind CSS 
HTTP Client: Axios
Build Tool: Vite 

📁 Project Structure
frontend/
├── public/
│   ├── logo
├── src/
│   ├── components/
│   │   ├── auth/
|   |         |-- ProtenctedRoute
│   │   ├── common/
|   |         |-- LoadingSpinner
│   │   └── layout/
|   |         |-- AdminNotification
|   |         |-- Footer
|   |         |-- Navbar
|   |         |-- PaymentModal
|   |         |-- QrCodeGenerator
|   |         |-- userNotification
│   ├── pages/
│   │   ├── admin
|   |         |-- Analytics
|   |         |-- Dashboard
|   |         |-- Menu
|   |         |-- Orders
|   |         |-- Payments
|   |         |-- Users
│   │   ├── auth
|   |         |-- ForgotPassword
|   |         |-- Login
|   |         |-- Register
│   │   ├── delivery
|   |         |-- Cart
|   |         |-- Home
|   |         |-- Menu
|   |         |-- OrderDetails
|   |         |-- Orders
|   |         |-- Profile
│   ├── context/
│   │   ├── AuthContext
│   │   └── SocketContext
│   ├── utils/
│   │   ├── api
│   ├── App.jsx
│   ├── index.jsx
│   └── main.jsx
├── .gitignore
├── package.json


👥 Author
Shraddha Mulekar



##Backend##


✨ Features

🔐 JWT-based authentication
👤 User management (Admin, User roles)
🍽️ Menu management (CRUD operations)
🛒 Order processing and tracking
💳 Payment integration
📧 Email notifications
📊 Analytics and reporting
🔄 Real-time updates with WebSockets
📝 Comprehensive logging
🛡️ Input validation and sanitization

🛠️ Tech Stack

Runtime: Node.js 
Framework: Express.js
Database: MongoDB 
ORM/ODM: Mongoose 
Authentication: JWT, bcrypt
Validation: Joi / express-validator
File Upload: Multer
Email: Nodemailer
Payment: Razorpay 
Documentation: OpenAPI

📁 Project Structure

backend/
├── server/
│   ├── bodyReq/
│   │   ├── admin
|   |         |-- adminDashboard-body-req
|   |         |-- allMenu-body-req
|   |         |-- allUsers-body-req
|   |         |-- broadcast-body-req
|   |         |-- createNewMenu-body-req
|   |         |-- new-user-body-req
|   |         |-- notification-body-req
|   |         |-- order-body-req
|   |         |-- ordersAnalytics-body-req
|   |         |-- payments-body-req
|   |         |-- refundPayment-body-req
|   |         |-- revenue-body-req
|   |         |-- updatedMenu-body-req
|   |         |-- updatedNotification-body-req
|   |         |-- updateOrderStatus-body-req
|   |         |-- updateUser-body-req
|   |         |-- updateUserNotification-body-req
|   |         |-- updateUserStatus-body-req
│   │   ├── auth
|   |         |-- forgot-password-body-req
|   |         |-- login-body-req
|   |         |-- password-body-req
|   |         |-- profile-body-req
|   |         |-- register-body-req
|   |         |-- reset-password-body-req
│   │   └── delivery
|   |         |-- assignedOrder-body-req
|   |         |-- availability-body-req
|   |         |-- staffProfilePage-body-req
|   |         |-- statusOrder-body-req
|   |         |-- updateStaffProfile-body-req
|   |         |-- updateStatusOrder-body-req
│   │   └── menu
|   |         |-- createDish-body-req
|   |         |-- publicMenu-body-req
│   │   └── notification
|   |         |-- getNotification-body-req
|   |         |-- stats-body-req
|   |         |-- test-body-req
|   |         |-- updatePrefernce-body-req
│   │   └── orders
|   |         |-- cancelOrder-body-req
|   |         |-- deliveryOrder-body-req
|   |         |-- newOrder-body-req
|   |         |-- rateOrder-body-req
|   |         |-- updateOrder-body-req
|   |         |-- userOrders-body-req
│   │   └── payments
|   |         |-- create-order-body-req
|   |         |-- refund-body-req
|   |         |-- verify-body-req
│   │   └── users
|   |         |-- checkEmail-body-req
|   |         |-- employees-body-req
|   |         |-- orders-body-req
|   |         |-- updateProfile-body-req
│   ├── middleware/
│   │   ├── auth
│   ├── models/
│   │   ├── Menu
│   │   ├── Notification
│   │   └── Order
│   │   └── User
│   ├── multer/
│   │   ├── admin
|   |         |-- adminStorageMulter
|   |         |-- adminUploadeMulter
│   │   ├── delivery
|   |         |-- deliveryStorageMulter
|   |         |-- deliveryUploadMulter
│   │   ├── menu
|   |         |-- storageMulter
|   |         |-- uploadMulter
│   ├── node_modules/
│   ├── pages/
│   │   ├── admin
│   │   ├── auth
│   │   ├── delivery
│   │   ├── menu
│   │   ├── notification
│   │   └── orders
│   │   ├── payments
│   │   ├── users
│   ├── routes/
│   │   ├── admin
│   │   ├── auth
│   │   ├── delivery
│   │   ├── menu
│   │   ├── notification
│   │   ├── orders
│   │   ├── payments
│   │   └── users
│   ├── uploads/
│   │   ├── menu
│   │   └── payments
│   ├── utils/
│   │   ├── auth
├── .env
├── .gitignore
├── package-lock-json
├── package.json
└── server.js

🛡️ Security Best Practices

✅ Environment variables for sensitive data
✅ JWT token authentication
✅ Password hashing with bcrypt
✅ Input validation and sanitization
✅ Rate limiting to prevent abuse
✅ CORS configuration
✅ Helmet.js for security headers
✅ MongoDB injection prevention
✅ XSS protection
✅ HTTPS in production

👥 Author
Shraddha Mulekar