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

// Update phone number
router.put('/update-phone', protect, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.user._id, { phone: phone.trim() }, { new: true });
    res.json({ success: true, data: { phone: user.phone } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update phone number' });
  }
});

module.exports = router;
