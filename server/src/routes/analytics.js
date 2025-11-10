const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInstructorAnalytics
} = require('../controllers/analyticsController');

// Analytics routes
router.get('/instructor/:instructorId', protect, getInstructorAnalytics);

module.exports = router;
