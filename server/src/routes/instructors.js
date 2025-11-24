const express = require('express');
const router = express.Router();
const {
  createOrUpdateProfile,
  getProfile,
  getAllInstructors,
  getInstructorById,
  updateAvailability,
  updatePricing,
  toggleVisibility,
  getStats,
  regenerateAvailability
} = require('../controllers/instructorController');
const { protect, isInstructor } = require('../middleware/auth');

// Public routes
router.get('/', getAllInstructors);
router.get('/:id', getInstructorById);
router.post('/regenerate-availability', regenerateAvailability); // Temporary public route

// Protected routes (Instructor only)
router.post('/profile', protect, isInstructor, createOrUpdateProfile);
router.get('/profile/me', protect, isInstructor, getProfile);
router.post('/profile/me', protect, isInstructor, createOrUpdateProfile); // Save settings
router.put('/profile/me', protect, isInstructor, createOrUpdateProfile); // Save settings (PUT)
router.put('/availability', protect, isInstructor, updateAvailability);
router.put('/pricing', protect, isInstructor, updatePricing);
router.put('/visibility', protect, isInstructor, toggleVisibility);
router.get('/stats/me', protect, isInstructor, getStats);

module.exports = router;
