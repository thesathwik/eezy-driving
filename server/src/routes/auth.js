const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
