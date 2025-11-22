import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCreditCard } from 'react-icons/fa';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: '#999',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

const StripePaymentForm = ({ amount, onPaymentSuccess, onPaymentError, learnerDetails, purchaseType, credits }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please wait and try again.');
      return;
    }

    // Validate card fields are complete
    const allFieldsComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc;
    if (!allFieldsComplete) {
      setError('Please complete all card details.');
      return;
    }

    // Validate learner details
    if (!learnerDetails.email || !learnerDetails.firstName || !learnerDetails.lastName) {
      setError('Missing learner details. Please go back and complete your registration.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create Payment Intent on your backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'aud',
          metadata: {
            learnerEmail: learnerDetails.email,
            learnerName: `${learnerDetails.firstName} ${learnerDetails.lastName}`,
            learnerPhone: learnerDetails.phone || 'Not provided',
            learnerId: learnerDetails._id || learnerDetails.id, // Ensure ID is passed
            type: purchaseType || 'booking', // 'package_purchase' or 'booking'
            credits: credits ? credits.toString() : undefined // e.g. '10'
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const { clientSecret, success, error: backendError } = await response.json();

      if (!success || backendError) {
        throw new Error(backendError || 'Failed to create payment intent');
      }

      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Step 2: Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: `${learnerDetails.firstName} ${learnerDetails.lastName}`,
            email: learnerDetails.email,
            phone: learnerDetails.phone || undefined,
          },
        },
        setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
      });

      if (stripeError) {
        // User-friendly error messages
        let errorMessage = stripeError.message;
        if (stripeError.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please try a different payment method.';
        } else if (stripeError.code === 'insufficient_funds') {
          errorMessage = 'Insufficient funds. Please use a different card.';
        } else if (stripeError.code === 'incorrect_cvc') {
          errorMessage = 'Incorrect CVC code. Please check and try again.';
        } else if (stripeError.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use a different card.';
        }

        setError(errorMessage);
        onPaymentError({ ...stripeError, userMessage: errorMessage });
      } else if (paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
      } else if (paymentIntent.status === 'processing') {
        setError('Payment is processing. Please wait...');
      } else if (paymentIntent.status === 'requires_payment_method') {
        setError('Payment failed. Please try a different payment method.');
      } else {
        setError(`Payment ${paymentIntent.status}. Please contact support.`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      onPaymentError({ message: errorMessage, originalError: err });
    } finally {
      setProcessing(false);
    }
  };

  // Handle card element changes for validation
  const handleCardChange = (elementType) => (event) => {
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete
    }));

    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="form-group">
        <label className="form-label">Card number</label>
        <div className="stripe-element-container">
          <FaCreditCard className="input-icon-left-payment" />
          <CardNumberElement
            options={CARD_ELEMENT_OPTIONS}
            className="stripe-element"
            onChange={handleCardChange('cardNumber')}
          />
        </div>
      </div>

      <div className="card-details-row">
        <div className="form-group">
          <label className="form-label">Expiry</label>
          <CardExpiryElement
            options={CARD_ELEMENT_OPTIONS}
            className="stripe-element"
            onChange={handleCardChange('cardExpiry')}
          />
        </div>

        <div className="form-group">
          <label className="form-label">CVC</label>
          <CardCvcElement
            options={CARD_ELEMENT_OPTIONS}
            className="stripe-element"
            onChange={handleCardChange('cardCvc')}
          />
        </div>
      </div>

      <label className="checkbox-option save-payment-checkbox">
        <input
          type="checkbox"
          checked={savePaymentMethod}
          onChange={(e) => setSavePaymentMethod(e.target.checked)}
          className="checkbox-input-yellow"
        />
        <span className="checkbox-custom-yellow"></span>
        <span className="checkbox-label">Save this payment method</span>
      </label>

      {error && (
        <div className="payment-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-pay-now"
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default StripePaymentForm;
