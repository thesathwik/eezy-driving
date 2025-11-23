const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Learner = require('../models/Learner');
const Instructor = require('../models/Instructor');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../services/emailService');

// Create Payment Intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'aud', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        integration: 'eazy_driving_school'
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// Confirm Payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      paymentIntent
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

// Get Payment Status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentIntent
    });
  } catch (error) {
    console.error('Error retrieving payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status',
      error: error.message
    });
  }
};

// Create Customer
exports.createCustomer = async (req, res) => {
  try {
    const { email, name, phone, metadata = {} } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata
    });

    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Webhook handler for Stripe events
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent was successful!', paymentIntent.id);
      console.log('Payment metadata:', paymentIntent.metadata);

      try {
        // Check if this is a package purchase
        if (paymentIntent.metadata.type === 'package_purchase') {
          const { learnerId, credits } = paymentIntent.metadata;

          if (!learnerId || !credits) {
            console.error('❌ Missing learnerId or credits in package purchase metadata');
            return;
          }

          const learner = await Learner.findById(learnerId);
          if (learner) {
            // Check if this payment intent has already been processed (e.g., by booking controller)
            const isProcessed = learner.progress.processedPaymentIntents?.includes(paymentIntent.id);

            if (isProcessed) {
              console.log(`ℹ️ Payment ${paymentIntent.id} already processed for learner ${learnerId}. Skipping credit addition.`);
            } else {
              learner.progress.lessonCredits = (learner.progress.lessonCredits || 0) + parseInt(credits);

              // Add to processed list
              if (!learner.progress.processedPaymentIntents) {
                learner.progress.processedPaymentIntents = [];
              }
              learner.progress.processedPaymentIntents.push(paymentIntent.id);

              await learner.save();
              console.log(`✅ Added ${credits} credits to learner ${learnerId}. New balance: ${learner.progress.lessonCredits}`);
            }
          } else {
            console.error(`❌ Learner not found for credit addition: ${learnerId}`);
          }
          return; // Exit as this is not a direct booking payment
        }

        // Find the booking by paymentIntentId
        const booking = await Booking.findOne({
          'payment.paymentIntentId': paymentIntent.id
        }).populate({
          path: 'learner',
          populate: { path: 'user' }
        }).populate({
          path: 'instructor',
          populate: { path: 'user' }
        });

        if (booking) {
          // Update booking status
          booking.status = 'confirmed';
          booking.payment.status = 'paid';
          booking.payment.paidAt = new Date();
          booking.payment.transactionId = paymentIntent.id;
          await booking.save();

          console.log('✅ Booking updated to confirmed:', booking._id);

          // Prepare email data
          const emailData = {
            learner: {
              firstName: booking.learner.user.firstName,
              lastName: booking.learner.user.lastName,
              email: booking.learner.user.email,
              phone: booking.learner.user.phone
            },
            instructor: {
              firstName: booking.instructor.user.firstName,
              lastName: booking.instructor.user.lastName,
              email: booking.instructor.user.email
            },
            lesson: {
              date: booking.lesson.date,
              startTime: booking.lesson.startTime,
              endTime: booking.lesson.endTime,
              duration: booking.lesson.duration,
              pickupLocation: booking.lesson.pickupLocation,
              dropoffLocation: booking.lesson.dropoffLocation,
              notes: booking.lesson.notes
            },
            pricing: {
              totalAmount: booking.pricing.totalAmount,
              instructorPayout: booking.pricing.instructorPayout
            }
          };

          // Send confirmation emails
          await sendBookingConfirmation(emailData);
          console.log('✅ Confirmation emails sent successfully');
        } else {
          console.warn('⚠️  No booking found for paymentIntentId:', paymentIntent.id);
        }
      } catch (error) {
        console.error('❌ Error processing payment success:', error);
        // Don't fail the webhook - log and continue
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ PaymentIntent failed:', failedPayment.id);
      console.log('Failure reason:', failedPayment.last_payment_error?.message);

      try {
        // Find and update the booking
        const failedBooking = await Booking.findOneAndUpdate(
          { 'payment.paymentIntentId': failedPayment.id },
          {
            status: 'cancelled',
            payment: {
              status: 'failed',
              paymentIntentId: failedPayment.id
            },
            cancellation: {
              cancelledBy: 'admin',
              cancelledAt: new Date(),
              reason: `Payment failed: ${failedPayment.last_payment_error?.message || 'Unknown error'}`
            }
          }
        );

        if (failedBooking) {
          console.log('✅ Booking marked as cancelled due to payment failure:', failedBooking._id);
        } else {
          console.warn('⚠️  No booking found for failed paymentIntentId:', failedPayment.id);
        }
      } catch (error) {
        console.error('❌ Error processing payment failure:', error);
      }
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Charge was refunded:', refund.id);
      // Handle refund logic
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
