const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllReviews,
  getInstructorReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

// Public routes
router.get('/instructor/:instructorId', getInstructorReviews);

// Protected routes
router.post('/', protect, createReview);
router.get('/', protect, getAllReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
