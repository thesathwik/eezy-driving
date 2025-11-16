import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, handleResponse, getHeaders } from '../../config/api';
import './Auth.css';

const VerificationSent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'learner';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [emailInput, setEmailInput] = useState(email);
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  const handleResendEmail = async () => {
    if (!emailInput) {
      setResendError('Please enter your email address');
      return;
    }

    setIsResending(true);
    setResendError('');
    setResendMessage('');

    try {
      const response = await fetch(API.auth.resendVerification, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email: emailInput })
      });

      const data = await handleResponse(response);

      if (data.success) {
        setResendMessage('Verification email sent successfully! Please check your inbox.');
        setShowChangeEmail(false);
      } else {
        setResendError(data.message || 'Failed to resend email');
      }
    } catch (error) {
      setResendError(error.data?.message || error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card verification-card">
          <div className="auth-header">
            <div className="verification-icon email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1>Check Your Email</h1>
            <p>We've sent a verification link to</p>
            <p className="email-display">{email}</p>
          </div>

          <div className="verification-info">
            <div className="info-box">
              <h3>What's next?</h3>
              <ol>
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>
                  {role === 'instructor'
                    ? 'Complete your instructor profile to start receiving bookings'
                    : 'Start booking driving lessons with verified instructors'}
                </li>
              </ol>
            </div>

            {resendMessage && (
              <div className="success-banner">
                {resendMessage}
              </div>
            )}

            {resendError && (
              <div className="error-banner">
                {resendError}
              </div>
            )}

            {!showChangeEmail ? (
              <div className="verification-actions">
                <button
                  onClick={handleResendEmail}
                  className="btn-auth btn-primary-auth"
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>

                <button
                  onClick={() => setShowChangeEmail(true)}
                  className="btn-auth btn-secondary-auth"
                >
                  Change Email Address
                </button>
              </div>
            ) : (
              <div className="change-email-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>

                <div className="verification-actions">
                  <button
                    onClick={handleResendEmail}
                    className="btn-auth btn-primary-auth"
                    disabled={isResending}
                  >
                    {isResending ? 'Sending...' : 'Send to New Email'}
                  </button>

                  <button
                    onClick={() => setShowChangeEmail(false)}
                    className="btn-auth btn-secondary-auth"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="auth-footer">
            <p>Didn't receive the email?</p>
            <ul className="help-list">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </div>

          <div className="back-link">
            <button onClick={() => navigate('/')} className="link-secondary">
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSent;
