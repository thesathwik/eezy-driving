import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../common/LocationAutocomplete';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    location: '',
    transmission: 'automatic'
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/instructors', { state: searchData });
  };

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="container hero-content">
        <div className="hero-text">
          <h1>Find Your Perfect Driving Instructor</h1>
          <p className="hero-subtitle">
            Connect with verified, professional instructors across Australia.
            Book lessons that fit your schedule and get your licence faster.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon-circle">★</div>
              <div>
                <div className="stat-value">4.9/5</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon-circle">+</div>
              <div>
                <div className="stat-value">50K+</div>
                <div className="stat-label">Happy Learners</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon-circle">✓</div>
              <div>
                <div className="stat-value">1,000+</div>
                <div className="stat-label">Certified Instructors</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-search-card">
          <h3>Start Your Journey Today</h3>
          <p className="search-subtitle">Find an instructor in your area</p>

          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <label htmlFor="location">
                Pickup Location
              </label>
              <LocationAutocomplete
                name="location"
                value={searchData.location}
                onChange={handleInputChange}
                placeholder="e.g. Parramatta or 2150"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="transmission">
                Transmission Type
              </label>
              <select
                id="transmission"
                name="transmission"
                value={searchData.transmission}
                onChange={handleInputChange}
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="both">Both</option>
              </select>
            </div>

            <button type="submit" className="btn btn-search">
              <span>Find Instructors</span>
              <span className="btn-icon">→</span>
            </button>
          </form>

          <div className="search-features">
            <div className="feature-badge">
              <span>✓</span> Instant booking
            </div>
            <div className="feature-badge">
              <span>✓</span> Flexible scheduling
            </div>
            <div className="feature-badge">
              <span>✓</span> No hidden fees
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
