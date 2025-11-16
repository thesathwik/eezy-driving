import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API, handleResponse, getHeaders } from '../../config/api';
import './Auth.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    verifyEmailToken();
  }, []);

  const verifyEmailToken = async () => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    try {
      const response = await fetch(API.auth.verifyEmail, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ token })
      });

      const data = await handleResponse(response);

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        setUserRole(data.data.user.role);

        // Store user session
        const userSession = {
          ...data.data.user,
          token: data.data.token
        };
        localStorage.setItem('eazydriving_session', JSON.stringify(userSession));

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          if (data.data.user.role === 'instructor') {
            navigate('/instructor/complete-profile');
          } else {
            navigate('/');
          }
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.data?.message || error.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendEmail = () => {
    // Navigate to resend page
    navigate('/auth/verification-sent?resend=true');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card verification-card">
          <div className="auth-header">
            {status === 'verifying' && (
              <>
                <div className="verification-spinner"></div>
                <h1>Verifying your email</h1>
                <p>Please wait while we verify your email address</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="verification-icon success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1>Email Verified</h1>
                <p>{message}</p>
                <p className="redirect-message">
                  {userRole === 'instructor'
                    ? 'Redirecting to complete your instructor profile...'
                    : 'Redirecting to homepage...'}
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="verification-icon error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1>Verification Failed</h1>
                <p className="error-text">{message}</p>
              </>
            )}
          </div>

          {status === 'error' && (
            <div className="verification-actions">
              <button
                onClick={handleResendEmail}
                className="btn-auth btn-primary-auth"
              >
                Resend Verification Email
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-auth btn-secondary-auth"
              >
                Go to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
