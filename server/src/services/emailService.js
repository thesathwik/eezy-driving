const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { Resend } = require('resend');

// Create email transporter
const createTransporter = () => {
  // Handle both naming conventions: createTransport (correct) and createTransporter (typo we had)
  const createTransporterFn = nodemailer.createTransport || nodemailer.createTransporter || nodemailer.default?.createTransport;

  if (!createTransporterFn) {
    console.error('❌ nodemailer transport creator is not available. Module structure:', Object.keys(nodemailer));
    throw new Error('nodemailer.createTransport is not a function');
  }

  // For production, use actual email service (Gmail, SendGrid, AWS SES, etc.)
  // For development, you can use ethereal.email for testing

  if (process.env.MAIL_SERVICE === 'gmail') {
    return createTransporterFn({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD?.replace(/\s+/g, '') // Remove spaces if present
      },
      // Additional settings to help with cloud server connections
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });
  } else if (process.env.MAIL_SERVICE === 'resend') {
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('📧 Using Resend API');

    return {
      sendMail: async (mailOptions) => {
        try {
          const { data, error } = await resend.emails.send({
            from: mailOptions.from || process.env.EMAIL_FROM || 'Eezy Driving <noreply@eezydriving.com.au>',
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text
          });

          if (error) {
            console.error('❌ Resend API Error:', error);
            throw new Error(error.message);
          }

          return { messageId: data.id };
        } catch (err) {
          console.error('❌ Error sending with Resend:', err);
          throw err;
        }
      }
    };
  } else if (process.env.MAIL_SERVICE === 'sendgrid') {
    // Use SendGrid HTTP API (works even if SMTP ports are blocked)
    console.log('📧 Using SendGrid HTTP API');
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
    // Return a mock transporter that uses SendGrid API
    return {
      sendMail: async (mailOptions) => {
        const msg = {
          to: mailOptions.to,
          from: mailOptions.from || process.env.EMAIL_FROM,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text
        };
        await sgMail.send(msg);
        return { messageId: 'sendgrid-' + Date.now() };
      }
    };
  } else if (process.env.MAIL_SERVICE === 'smtp') {
    console.log('📧 Configuring SMTP with:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER
    });

    return createTransporterFn({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      // Additional timeout settings
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Disable TLS certificate validation for cloud environments
      tls: {
        rejectUnauthorized: false
      },
      // Enable debug logging
      debug: process.env.NODE_ENV !== 'production',
      logger: process.env.NODE_ENV !== 'production'
    });
  } else {
    // Fallback to console logging if no email service configured
    console.warn('⚠️  No email service configured. Emails will be logged to console.');
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 EMAIL WOULD BE SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('---');
        return { messageId: 'console-' + Date.now() };
      }
    };
  }
};

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time for display
const formatTime = (time) => {
  return time;
};

// Email template styles
const emailStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #1a1a1a;
      color: #ffffff;
      padding: 32px 24px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .booking-details {
      background-color: #f9f9f9;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 500;
      color: #666;
    }
    .detail-value {
      font-weight: 500;
      color: #1a1a1a;
      text-align: right;
    }
    .price-total {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .button-primary {
      display: inline-block;
      background-color: #1a1a1a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 500;
      margin: 16px 0;
      text-align: center;
    }
    .info-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    .email-footer {
      background-color: #f9f9f9;
      padding: 24px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer-links {
      margin-top: 16px;
    }
    .footer-links a {
      color: #666;
      text-decoration: none;
      margin: 0 12px;
    }
  </style>
`;

// Learner confirmation email template
const learnerConfirmationEmail = (bookingData) => {
  const { learner, instructor, lesson, pricing } = bookingData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🎉 Booking Confirmed!</h1>
        </div>

        <div class="email-body">
          <p class="greeting">Hi ${learner.firstName},</p>

          <p>Great news! Your driving lesson has been confirmed and payment was successful.</p>

          <div class="booking-details">
            <h3 style="margin-top: 0;">Lesson Details</h3>

            <div class="detail-row">
              <span class="detail-label">Instructor</span>
              <span class="detail-value">${instructor.firstName} ${instructor.lastName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(lesson.date)}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${formatTime(lesson.startTime)} - ${formatTime(lesson.endTime)}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${lesson.duration} hour${lesson.duration !== 1 ? 's' : ''}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Pickup Location</span>
              <span class="detail-value">${lesson.pickupLocation.address}</span>
            </div>

            ${lesson.dropoffLocation ? `
            <div class="detail-row">
              <span class="detail-label">Dropoff Location</span>
              <span class="detail-value">${lesson.dropoffLocation.address}</span>
            </div>
            ` : ''}

            <div class="detail-row" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a1a;">
              <span class="detail-label price-total">Total Paid</span>
              <span class="detail-value price-total">$${pricing.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="info-box">
            <strong>📱 What's Next?</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>Your instructor will contact you 24 hours before the lesson</li>
              <li>Make sure you have your learner permit with you</li>
              <li>Be ready at your pickup location 5 minutes early</li>
            </ul>
          </div>

          <center>
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/dashboard/learner/bookings" class="button-primary">
              View Booking
            </a>
          </center>

          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            Need to make changes? You can reschedule or cancel up to 24 hours before your lesson without penalty.
          </p>
        </div>

        <div class="email-footer">
          <p>Thank you for choosing Eezy Driving!</p>
          <div class="footer-links">
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/support">Help Center</a>
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/contact">Contact Us</a>
          </div>
          <p style="margin-top: 16px; font-size: 12px;">
            © ${new Date().getFullYear()} Eezy Driving. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Instructor confirmation email template
const instructorConfirmationEmail = (bookingData) => {
  const { learner, instructor, lesson, pricing } = bookingData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>📅 New Booking Confirmed</h1>
        </div>

        <div class="email-body">
          <p class="greeting">Hi ${instructor.firstName},</p>

          <p>You have a new booking! Payment has been confirmed and the lesson is now in your schedule.</p>

          <div class="booking-details">
            <h3 style="margin-top: 0;">Lesson Details</h3>

            <div class="detail-row">
              <span class="detail-label">Learner</span>
              <span class="detail-value">${learner.firstName} ${learner.lastName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Contact</span>
              <span class="detail-value">${learner.phone || learner.email}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(lesson.date)}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${formatTime(lesson.startTime)} - ${formatTime(lesson.endTime)}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${lesson.duration} hour${lesson.duration !== 1 ? 's' : ''}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Pickup Location</span>
              <span class="detail-value">${lesson.pickupLocation.address}</span>
            </div>

            ${lesson.dropoffLocation ? `
            <div class="detail-row">
              <span class="detail-label">Dropoff Location</span>
              <span class="detail-value">${lesson.dropoffLocation.address}</span>
            </div>
            ` : ''}

            ${lesson.notes ? `
            <div class="detail-row">
              <span class="detail-label">Learner Notes</span>
              <span class="detail-value">${lesson.notes}</span>
            </div>
            ` : ''}

            <div class="detail-row" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a1a;">
              <span class="detail-label price-total">Your Earnings</span>
              <span class="detail-value price-total">$${pricing.instructorPayout.toFixed(2)}</span>
            </div>
          </div>

          <div class="info-box">
            <strong>📝 Action Required</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>Contact the learner 24 hours before the lesson</li>
              <li>Confirm pickup location and time</li>
              <li>Check your vehicle is ready</li>
            </ul>
          </div>

          <center>
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/dashboard/instructor/bookings" class="button-primary">
              View Booking
            </a>
          </center>

          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            Payment will be transferred to your account within 2-3 business days after the lesson is completed.
          </p>
        </div>

        <div class="email-footer">
          <p>Happy teaching!</p>
          <div class="footer-links">
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/support">Help Center</a>
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/contact">Contact Us</a>
          </div>
          <p style="margin-top: 16px; font-size: 12px;">
            © ${new Date().getFullYear()} Eezy Driving. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send booking confirmation emails
const sendBookingConfirmation = async (bookingData) => {
  const transporter = createTransporter();

  try {
    const { learner, instructor } = bookingData;

    // Send email to learner
    const learnerEmail = {
      from: `"Eezy Driving" <${process.env.EMAIL_FROM || 'noreply@eezydriving.com'}>`,
      to: learner.email,
      subject: '🎉 Your Driving Lesson is Confirmed!',
      html: learnerConfirmationEmail(bookingData)
    };

    const learnerResult = await transporter.sendMail(learnerEmail);
    console.log('✅ Learner confirmation email sent:', learnerResult.messageId);

    // Send email to instructor
    const instructorEmail = {
      from: `"Eezy Driving" <${process.env.EMAIL_FROM || 'noreply@eezydriving.com'}>`,
      to: instructor.email,
      subject: '📅 New Booking Confirmed',
      html: instructorConfirmationEmail(bookingData)
    };

    const instructorResult = await transporter.sendMail(instructorEmail);
    console.log('✅ Instructor confirmation email sent:', instructorResult.messageId);

    return {
      success: true,
      learnerEmailId: learnerResult.messageId,
      instructorEmailId: instructorResult.messageId
    };
  } catch (error) {
    console.error('❌ Error sending booking confirmation emails:', error);
    throw error;
  }
};

// Email verification template
const emailVerificationTemplate = (userData, verificationUrl) => {
  const { firstName, role } = userData;
  const isInstructor = role === 'instructor';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${emailStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>✉️ Verify Your Email</h1>
        </div>

        <div class="email-body">
          <p class="greeting">Hi ${firstName},</p>

          <p>Welcome to Eezy Driving! We're excited to have you${isInstructor ? ' join our community of professional driving instructors' : ' on board'}.</p>

          <p>To complete your registration and ${isInstructor ? 'set up your instructor profile' : 'start booking lessons'}, please verify your email address by clicking the button below:</p>

          <center>
            <a href="${verificationUrl}" class="button-primary" style="display: inline-block; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; margin: 24px 0;">
              Verify Email Address
            </a>
          </center>

          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #666; word-break: break-all;">${verificationUrl}</a>
          </p>

          <div class="info-box">
            <strong>⏰ Important:</strong><br>
            This verification link will expire in 24 hours. If you didn't create an account with Eezy Driving, you can safely ignore this email.
          </div>

          ${isInstructor ? `
            <p style="margin-top: 24px;">After verifying your email, you'll be able to:</p>
            <ul style="color: #666;">
              <li>Complete your instructor profile</li>
              <li>Set your availability and pricing</li>
              <li>Start receiving booking requests</li>
              <li>Grow your driving school business</li>
            </ul>
          ` : `
            <p style="margin-top: 24px;">After verifying your email, you can:</p>
            <ul style="color: #666;">
              <li>Search for driving instructors in your area</li>
              <li>Book driving lessons instantly</li>
              <li>Track your progress</li>
              <li>Manage your bookings easily</li>
            </ul>
          `}
        </div>

        <div class="email-footer">
          <p>Need help? Contact our support team</p>
          <div class="footer-links">
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/support">Help Center</a>
            <a href="${process.env.FRONTEND_URL || 'https://eezydriving.com'}/contact">Contact Us</a>
          </div>
          <p style="margin-top: 16px; font-size: 12px;">
            © ${new Date().getFullYear()} Eezy Driving. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email verification
const sendVerificationEmail = async (user, verificationToken) => {
  const transporter = createTransporter();

  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://eezydriving.com'}/verify-email?token=${verificationToken}`;

    const emailOptions = {
      from: `"Eezy Driving" <${process.env.EMAIL_FROM || 'noreply@eezydriving.com'}>`,
      to: user.email,
      subject: 'Verify Your Email - Eezy Driving',
      html: emailVerificationTemplate({
        firstName: user.firstName,
        role: user.role
      }, verificationUrl)
    };

    const result = await transporter.sendMail(emailOptions);
    console.log('✅ Verification email sent:', result.messageId);

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendVerificationEmail
};
