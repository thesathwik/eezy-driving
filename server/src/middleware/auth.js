const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Check if user changed password after token was issued
      if (req.user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check if user is instructor
exports.isInstructor = async (req, res, next) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({
      success: false,
      message: 'Only instructors can access this route'
    });
  }
  next();
};

// Check if user is learner
exports.isLearner = async (req, res, next) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({
      success: false,
      message: 'Only learners can access this route'
    });
  }
  next();
};
