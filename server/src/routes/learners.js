const express = require('express');
const router = express.Router();
const { protect, isLearner } = require('../middleware/auth');

// Placeholder routes - to be implemented
router.get('/profile', protect, isLearner, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Learner profile endpoint - Coming soon'
  });
});

module.exports = router;
