require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for React app to load properly
})); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Stripe webhook endpoint needs raw body - must come before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/learners', require('./routes/learners'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/payment', require('./routes/payment'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EAZYDRIVING API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../../build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
} else {
  // Root route for development
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to EAZYDRIVING API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        instructors: '/api/instructors',
        learners: '/api/learners',
        bookings: '/api/bookings',
        reviews: '/api/reviews',
        payment: '/api/payment'
      }
    });
  });

  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║                                              ║');
  console.log('║      🚗 EAZYDRIVING API SERVER  🚗          ║');
  console.log('║                                              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💻 Client: ${process.env.CLIENT_URL}`);
  console.log('');
  console.log('📡 Available endpoints:');
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
