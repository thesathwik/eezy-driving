const { sendBookingConfirmation } = require('./emailService');

// Initialize Twilio client (lazy, only when needed)
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  const twilio = require('twilio');
  return twilio(accountSid, authToken);
};

// Format booking data into a human-readable date string
const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

// Send SMS notifications for a booking
const sendBookingSMS = async (bookingData) => {
  const client = getTwilioClient();
  if (!client) {
    console.warn('⚠️  Twilio not configured — skipping SMS notifications');
    return null;
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    console.warn('⚠️  TWILIO_PHONE_NUMBER not set — skipping SMS notifications');
    return null;
  }

  const { learner, instructor, lesson } = bookingData;
  const dateStr = formatDateShort(lesson.date);
  const results = {};

  // Send SMS to learner
  if (learner.phone) {
    try {
      const msg = await client.messages.create({
        body: `Your lesson with ${instructor.firstName} on ${dateStr} at ${lesson.startTime} is confirmed!`,
        from: fromNumber,
        to: learner.phone
      });
      results.learnerSms = msg.sid;
      console.log('✅ Learner SMS sent:', msg.sid);
    } catch (err) {
      console.error('❌ Failed to send learner SMS:', err.message);
    }
  }

  // Send SMS to instructor
  if (instructor.phone) {
    try {
      const msg = await client.messages.create({
        body: `New booking: ${learner.firstName} ${learner.lastName} on ${dateStr} at ${lesson.startTime}, pickup: ${lesson.pickupLocation.address}`,
        from: fromNumber,
        to: instructor.phone
      });
      results.instructorSms = msg.sid;
      console.log('✅ Instructor SMS sent:', msg.sid);
    } catch (err) {
      console.error('❌ Failed to send instructor SMS:', err.message);
    }
  }

  return results;
};

// Send WhatsApp notifications for a booking
const sendBookingWhatsApp = async (bookingData) => {
  const client = getTwilioClient();
  if (!client) {
    console.warn('⚠️  Twilio not configured — skipping WhatsApp notifications');
    return null;
  }

  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!whatsappNumber) {
    console.warn('⚠️  TWILIO_WHATSAPP_NUMBER not set — skipping WhatsApp notifications');
    return null;
  }

  const fromWhatsApp = `whatsapp:${whatsappNumber}`;
  const { learner, instructor, lesson } = bookingData;
  const dateStr = formatDateShort(lesson.date);
  const results = {};

  // Send WhatsApp to learner
  if (learner.phone) {
    try {
      const msg = await client.messages.create({
        body: `Your lesson with ${instructor.firstName} on ${dateStr} at ${lesson.startTime} is confirmed!`,
        from: fromWhatsApp,
        to: `whatsapp:${learner.phone}`
      });
      results.learnerWhatsApp = msg.sid;
      console.log('✅ Learner WhatsApp sent:', msg.sid);
    } catch (err) {
      console.error('❌ Failed to send learner WhatsApp:', err.message);
    }
  }

  // Send WhatsApp to instructor
  if (instructor.phone) {
    try {
      const msg = await client.messages.create({
        body: `New booking: ${learner.firstName} ${learner.lastName} on ${dateStr} at ${lesson.startTime}, pickup: ${lesson.pickupLocation.address}`,
        from: fromWhatsApp,
        to: `whatsapp:${instructor.phone}`
      });
      results.instructorWhatsApp = msg.sid;
      console.log('✅ Instructor WhatsApp sent:', msg.sid);
    } catch (err) {
      console.error('❌ Failed to send instructor WhatsApp:', err.message);
    }
  }

  return results;
};

// Orchestrator: send email + SMS + WhatsApp in parallel
const sendBookingNotifications = async (bookingData) => {
  const results = await Promise.allSettled([
    sendBookingConfirmation(bookingData).catch(err => {
      console.error('❌ Email notification failed:', err.message);
      return null;
    }),
    sendBookingSMS(bookingData).catch(err => {
      console.error('❌ SMS notification failed:', err.message);
      return null;
    }),
    sendBookingWhatsApp(bookingData).catch(err => {
      console.error('❌ WhatsApp notification failed:', err.message);
      return null;
    })
  ]);

  return {
    email: results[0].status === 'fulfilled' ? results[0].value : null,
    sms: results[1].status === 'fulfilled' ? results[1].value : null,
    whatsapp: results[2].status === 'fulfilled' ? results[2].value : null
  };
};

module.exports = {
  sendBookingSMS,
  sendBookingWhatsApp,
  sendBookingNotifications
};
