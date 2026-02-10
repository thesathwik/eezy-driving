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
router.get('/regenerate-availability', regenerateAvailability);

// Protected routes (Instructor only)
// POST /profile allows any authenticated user to create/update their instructor profile.
// The user's role is checked and upgraded to 'instructor' in the controller if needed.
router.post('/profile', protect, createOrUpdateProfile);
router.get('/profile/me', protect, isInstructor, getProfile);
router.post('/profile/me', protect, isInstructor, createOrUpdateProfile); // Save settings
router.put('/profile/me', protect, isInstructor, createOrUpdateProfile); // Save settings (PUT)
router.put('/availability', protect, isInstructor, updateAvailability);
router.put('/pricing', protect, isInstructor, updatePricing);
router.put('/visibility', protect, isInstructor, toggleVisibility);
router.get('/stats/me', protect, isInstructor, getStats);

// Public catch-all — MUST be last (matches /:id for any path segment)
router.get('/:id', getInstructorById);

module.exports = router;
