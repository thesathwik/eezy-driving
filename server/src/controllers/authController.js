const User = require('../models/User');
const Instructor = require('../models/Instructor');
const Learner = require('../models/Learner');
const { sendVerificationEmail } = require('../services/emailService');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // If user exists but is NOT verified, delete the old account and allow re-registration
      if (!existingUser.isEmailVerified) {
        console.log(`Deleting unverified user account for ${email} to allow re-registration`);
        await User.findByIdAndDelete(existingUser._id);
        // Also delete any associated instructor/learner profiles
        if (existingUser.role === 'instructor') {
          await Instructor.deleteOne({ user: existingUser._id });
        } else if (existingUser.role === 'learner') {
          await Learner.deleteOne({ user: existingUser._id });
        }
      } else {
        // User exists and is verified
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists. Please login instead.'
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone: phone || '', // Optional field
      role: role || 'learner'
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email with timeout
    try {
      const emailPromise = sendVerificationEmail(user, verificationToken);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email sending timeout')), 10000)
      );
      await Promise.race([emailPromise, timeoutPromise]);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('Error sending verification email:', emailError.message);
      // Don't fail registration if email fails - user account is still created
    }

    // DO NOT generate auth token - user must verify email first
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified // Explicitly return this for frontend checks
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Get user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.generateAuthToken();

    // Get profile data based on role
    let profileData = null;
    if (user.role === 'instructor') {
      profileData = await Instructor.findOne({ user: user._id });
    } else if (user.role === 'learner') {
      profileData = await Learner.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
          profileData
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;

    // Get profile data based on role
    let profileData = null;
    if (user.role === 'instructor') {
      profileData = await Instructor.findOne({ user: user._id });
    } else if (user.role === 'learner') {
      profileData = await Learner.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
          profileData
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Hash the token to compare with stored hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and check expiration
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      // Still log them in if already verified
      const authToken = user.generateAuthToken();

      // Get profile data
      let profileData = null;
      if (user.role === 'instructor') {
        profileData = await Instructor.findOne({ user: user._id });
      } else if (user.role === 'learner') {
        profileData = await Learner.findOne({ user: user._id });
      }

      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isProfileComplete: user.isProfileComplete,
            profileData
          },
          token: authToken
        }
      });
    }

    // Update user to verified status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate auth token for auto-login
    const authToken = user.generateAuthToken();

    // Get profile data based on role
    let profileData = null;
    if (user.role === 'instructor') {
      profileData = await Instructor.findOne({ user: user._id });
    } else if (user.role === 'learner') {
      profileData = await Learner.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isProfileComplete: user.isProfileComplete,
          profileData
        },
        token: authToken
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    next(error);
  }
};
