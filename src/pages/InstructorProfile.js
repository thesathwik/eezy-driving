import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaStar, FaCar, FaCheckCircle, FaIdCard, FaClock,
  FaCalendarAlt, FaUserFriends, FaCalendarCheck, FaUserClock, FaInfoCircle,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { getInstructorById } from '../data/instructors';
import ServiceAreaMap from '../components/maps/ServiceAreaMap';
import './InstructorProfile.css';

const InstructorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const instructor = getInstructorById(id);

  const [showFullBio, setShowFullBio] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showServiceArea, setShowServiceArea] = useState(false);

  if (!instructor) {
    return (
      <div className="profile-page">
        <div className="container">
          <h2>Instructor not found</h2>
          <Link to="/instructors" className="btn-back">Back to Instructors</Link>
        </div>
      </div>
    );
  }

  // Sample reviews data
  const reviews = [
    {
      name: 'Ashleigh',
      date: 'Posted on 4 Nov 2025',
      rating: 5,
      comment: 'He was good, going to book again soon thanks!'
    },
    {
      name: 'Samuel',
      date: 'Posted on 19 Oct 2025',
      rating: 5,
      comment: 'He teach me very well'
    },
    {
      name: 'Sandra',
      date: 'Posted on 20 Aug 2025',
      rating: 5,
      comment: 'Abdul was great, has great knowledge about driving and is great for beginners'
    },
    {
      name: 'Kirra',
      date: 'Posted on 18 May 2025',
      rating: 1,
      comment: 'My lesson is not approved for 16/02/2025'
    },
    {
      name: 'John jay',
      date: 'Posted on 14 May 2025',
      rating: 5,
      comment: 'hes good instructor💯'
    }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  return (
    <div className="profile-page">
      {/* Yellow Header */}
      <div className="profile-header">
        <div className="container">
          <button className="btn-back-profile" onClick={() => navigate('/instructors')}>
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>

      {/* Instructor Header Card */}
      <div className="instructor-header-card">
        <div className="container">
          <div className="header-content">
            <div className="instructor-photos">
              <div className="photo-circle instructor-photo-circle">
                <div className="instructor-avatar-profile">
                  {instructor.avatar}
                </div>
              </div>
              <div className="photo-circle car-photo-circle">
                <FaCar className="car-icon-large" />
              </div>
            </div>
            <div className="instructor-title">
              <h1>{instructor.name}</h1>
              <div className="instructor-rating-profile">
                <div className="stars-row">
                  {renderStars(Math.floor(instructor.rating))}
                </div>
                <span className="rating-text">
                  {instructor.rating} · {instructor.reviewCount} ratings
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        <div className="container">
          <div className="profile-layout">
            {/* Left Column */}
            <div className="profile-main">
              {/* Instructor Bio */}
              <section className="profile-section">
                <h2>Instructor Bio</h2>
                <div className={`bio-text ${showFullBio ? 'expanded' : ''}`}>
                  <p>
                    My name is {instructor.name}. I have been a driving instructor since 2024. I have always enjoyed helping
                    others. I am patient and understanding. I highly enjoy seeing learners gain confidence and
                    independence. I am knowledgeable about road safety and risk management and will emphasise
                    these principles in my lessons. My main goal when working with learners is to help you become a safe,
                    risk-averse driver. My past career as a seafarer gave me opportunities to visit many parts of this globe
                    meeting differen...
                  </p>
                  {showFullBio && (
                    <p>
                      {instructor.bio}
                    </p>
                  )}
                </div>
                <button
                  className="btn-show-more"
                  onClick={() => setShowFullBio(!showFullBio)}
                >
                  {showFullBio ? 'Show less' : 'Show more'}
                </button>

                {/* Instructor Details */}
                <div className="instructor-details">
                  <div className="detail-item">
                    <FaCar className="detail-icon" />
                    <span>Auto Lessons & <strong>Test Packages</strong></span>
                  </div>
                  <div className="detail-item">
                    <FaCheckCircle className="detail-icon" />
                    <span>Verified Working with Children Check</span>
                  </div>
                  <div className="detail-item">
                    <FaIdCard className="detail-icon" />
                    <span>Driving Instructor's Licence</span>
                  </div>
                  <div className="detail-item">
                    <FaClock className="detail-icon" />
                    <span>Instructed for {instructor.experience} yr. 0 mo.</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="languages-section">
                  <h3>Spoken language(s)</h3>
                  <div className="language-badges">
                    <span className="language-badge">English</span>
                  </div>
                </div>
              </section>

              {/* Reviews Section */}
              <section className="profile-section reviews-section">
                <h2>Reviews</h2>
                {reviews.map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <div className="review-info">
                        <h4>{review.name}</h4>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-stars">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}

                {/* Pagination */}
                <div className="pagination">
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">3</button>
                  <button className="page-btn">Next ›</button>
                  <button className="page-btn">Last »</button>
                </div>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="profile-sidebar">
              {/* Pricing Card */}
              <div className="pricing-card">
                <div className="pricing-section">
                  <h3>Hourly Price</h3>
                  <div className="price-row">
                    <span className="price-label">Offers 1 & 2hr lessons</span>
                    <span className="price-value">${instructor.pricePerHour}/hr</span>
                  </div>
                </div>

                <div className="pricing-section">
                  <div className="price-row">
                    <span className="price-label">6hrs or more</span>
                    <span className="price-badge save">SAVE 5%</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">10hrs or more</span>
                    <span className="price-badge save">SAVE 10%</span>
                  </div>
                </div>

                <div className="pricing-section">
                  <div className="price-row">
                    <span className="price-label">
                      Test Package (2.5 hrs) <FaInfoCircle className="info-icon-small" />
                    </span>
                    <span className="price-value">$225</span>
                  </div>
                </div>

                <button
                  className="btn-book-now"
                  onClick={() => navigate(`/book/${instructor.id}`)}
                >
                  Book Now ›
                </button>

                <button
                  className="btn-check-availability"
                  onClick={() => navigate(`/instructors/${instructor.id}/availability`)}
                >
                  Check Availability
                </button>

                {/* Payment Methods */}
                <div className="payment-methods">
                  <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" />
                  <img src="https://img.icons8.com/color/48/mastercard.png" alt="Mastercard" />
                  <img src="https://img.icons8.com/color/48/amex.png" alt="Amex" />
                  <img src="https://img.icons8.com/color/48/paypal.png" alt="PayPal" />
                </div>
              </div>

              {/* Buy Now Pay Later Card */}
              <div className="payment-options-card">
                <h4>
                  Buy Now Pay Later <FaInfoCircle className="info-icon-small" />
                </h4>
                <p className="payment-subtitle">4 payments of $20.00</p>
                <div className="payment-logos">
                  <img src="https://img.icons8.com/color/48/paypal.png" alt="PayPal" />
                  <span className="payment-text">Pay in 4</span>
                </div>
              </div>

              {/* Features Card */}
              <div className="features-card">
                <div className="feature-item">
                  <FaCalendarAlt className="feature-icon" />
                  <div className="feature-text">
                    <h4>Reschedule online</h4>
                    <p>Reschedule online up to 24 hours before a booking.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <FaUserFriends className="feature-icon" />
                  <div className="feature-text">
                    <h4>Instructor choice</h4>
                    <p>Choose your instructor, change online anytime.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <FaCalendarCheck className="feature-icon" />
                  <div className="feature-text">
                    <h4>Book now or later</h4>
                    <p>Buy a package, make bookings now or later.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <FaUserClock className="feature-icon" />
                  <div className="feature-text">
                    <h4>Real-time availability</h4>
                    <p>Book directly into your instructor's calendar.</p>
                  </div>
                </div>

                <button
                  className="btn-more-info"
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                >
                  <FaInfoCircle /> More info about bookings
                  {showMoreInfo ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>

              {/* Vehicle Card */}
              <div className="vehicle-card">
                <h3>{instructor.name}'s vehicle</h3>
                <div className="vehicle-info">
                  <div className="vehicle-image">
                    <FaCar className="car-icon-large" />
                  </div>
                  <div className="vehicle-details">
                    <h4>{instructor.vehicle}</h4>
                    <p>5-star ANCAP rating</p>
                    <p>Dual controls fitted</p>
                  </div>
                </div>
              </div>

              {/* Service Area Card */}
              <div className="service-area-card">
                <button
                  className="btn-service-area"
                  onClick={() => setShowServiceArea(!showServiceArea)}
                >
                  <span>{instructor.name} services {instructor.location}</span>
                  {showServiceArea ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {showServiceArea && (
                  <div className="service-area-map">
                    <ServiceAreaMap location={instructor.location} />
                    <p className="service-note">Instructor service area in yellow.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfile;
