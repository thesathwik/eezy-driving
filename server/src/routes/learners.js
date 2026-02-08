const express = require('express');
const router = express.Router();
const { protect, isLearner } = require('../middleware/auth');
const Learner = require('../models/Learner');

// @desc    Get current learner's profile
// @route   GET /api/learners/profile/me
// @access  Private (Learner)
router.get('/profile/me', protect, isLearner, async (req, res) => {
  try {
    const learner = await Learner.findOne({ user: req.user._id })
      .populate({
        path: 'progress.currentInstructor',
        populate: {
          path: 'user',
          select: 'firstName lastName phone email'
        }
      });

    if (!learner) {
      return res.status(404).json({
        success: false,
        message: 'Learner profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: learner._id,
        user: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          phone: req.user.phone
        },
        lessonCredits: learner.progress.lessonCredits || 0,
        totalLessonsCompleted: learner.progress.totalLessonsCompleted || 0,
        totalHoursCompleted: learner.progress.totalHoursCompleted || 0,
        currentInstructor: learner.progress.currentInstructor || null,
        licence: learner.licence,
        preferences: learner.preferences,
        status: learner.status
      }
    });
  } catch (error) {
    console.error('Error fetching learner profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching learner profile',
      error: error.message
    });
  }
});

module.exports = router;
