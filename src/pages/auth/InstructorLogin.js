import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const InstructorLogin = () => {
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
      const result = await login(formData.email, formData.password, 'instructor');

      if (result.success) {
        navigate('/instructor/dashboard');
      } else {
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
            <h1>Instructor Login</h1>
            <p>Welcome back! Access your instructor dashboard</p>
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
            <p>Not registered yet?</p>
            <Link to="/signup/instructor" className="link-primary">
              Create an instructor account
            </Link>
          </div>

          <div className="auth-switch">
            <p>Are you a learner?</p>
            <Link to="/login/learner" className="link-secondary">
              Sign in as learner
            </Link>
          </div>
        </div>

        <div className="auth-info auth-info-instructor">
          <h2>Grow Your Driving School Business</h2>
          <ul className="info-list">
            <li>
              <div className="info-icon">✓</div>
              <div>
                <h4>Reach More Students</h4>
                <p>Connect with thousands of learners across Australia</p>
              </div>
            </li>
            <li>
              <div className="info-icon">✓</div>
              <div>
                <h4>Manage Your Schedule</h4>
                <p>Control your availability and bookings in one place</p>
              </div>
            </li>
            <li>
              <div className="info-icon">✓</div>
              <div>
                <h4>Get Paid Securely</h4>
                <p>Receive payments directly with our secure platform</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstructorLogin;
