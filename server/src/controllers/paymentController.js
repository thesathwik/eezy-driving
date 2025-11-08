const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
      console.log('PaymentIntent was successful!', paymentIntent.id);
      console.log('Payment metadata:', paymentIntent.metadata);

      // The metadata contains booking information
      // In a production app, you would:
      // 1. Find the booking by paymentIntentId
      // 2. Update booking status to 'confirmed'
      // 3. Send confirmation email to learner and instructor

      // Example database update (uncomment when Booking model exists):
      /*
      const Booking = require('../models/Booking');
      await Booking.findOneAndUpdate(
        { 'paymentIntent.id': paymentIntent.id },
        {
          status: 'confirmed',
          'paymentIntent.status': 'succeeded',
          confirmedAt: new Date()
        }
      );
      */
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      console.log('Failure reason:', failedPayment.last_payment_error?.message);

      // Update booking status to 'payment_failed'
      // Send notification to learner

      // Example database update (uncomment when Booking model exists):
      /*
      const Booking = require('../models/Booking');
      await Booking.findOneAndUpdate(
        { 'paymentIntent.id': failedPayment.id },
        {
          status: 'payment_failed',
          'paymentIntent.status': 'failed',
          failureReason: failedPayment.last_payment_error?.message
        }
      );
      */
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
