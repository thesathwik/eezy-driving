import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const LearnerLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password, 'learner');

      if (result.success) {
        navigate('/');
      } else {
        // Handle error
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Learner Login</h1>
            <p>Welcome back! Sign in to continue your driving journey</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn-auth btn-primary-auth"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <Link to="/signup/learner" className="link-primary">
              Create a learner account
            </Link>
          </div>

          <div className="auth-switch">
            <p>Are you an instructor?</p>
            <Link to="/login/instructor" className="link-secondary">
              Sign in as instructor
            </Link>
          </div>
        </div>

        <div className="auth-info">
          <h2>Start Your Driving Journey</h2>
          <ul className="info-list">
            <li>
              <div className="info-icon">✓</div>
              <div>
                <h4>Find Verified Instructors</h4>
                <p>Browse through 1,000+ certified instructors across Australia</p>
              </div>
            </li>
            <li>
              <div className="info-icon">✓</div>
              <div>
                <h4>Book Lessons Anytime</h4>
                <p>Schedule lessons 24/7 that fit your timetable</p>
              </div>
            </li>
            <li>
              <div className="info-icon">✓</div>
              <div>
                <h4>Track Your Progress</h4>
                <p>Log your hours and monitor your journey to getting your licence</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;
