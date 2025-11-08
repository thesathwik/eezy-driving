const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  createCustomer,
  handleWebhook
} = require('../controllers/paymentController');

// Create Payment Intent
router.post('/create-payment-intent', createPaymentIntent);

// Confirm Payment
router.post('/confirm-payment', confirmPayment);

// Get Payment Status
router.get('/status/:paymentIntentId', getPaymentStatus);

// Create Stripe Customer
router.post('/create-customer', createCustomer);

// Stripe Webhook (raw body is handled in server.js middleware)
router.post('/webhook', handleWebhook);

module.exports = router;
