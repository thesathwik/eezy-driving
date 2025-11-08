const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reviews endpoint - Coming soon'
  });
});

module.exports = router;
