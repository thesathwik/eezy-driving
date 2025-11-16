import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaStar, FaCar, FaCheckCircle, FaIdCard, FaClock,
  FaCalendarAlt, FaUserFriends, FaCalendarCheck, FaUserClock, FaInfoCircle,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { getHeaders } from '../config/api';
import ServiceAreaMap from '../components/maps/ServiceAreaMap';
import './InstructorProfile.css';

const InstructorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showServiceArea, setShowServiceArea] = useState(false);

  // Fetch instructor data
  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/instructors/${id}`, {
          headers: getHeaders(false)
        });

        const data = await response.json();

        if (data.success) {
          const instructorData = data.data;

          // Calculate years and months of experience from instructingSince
          let yearsExperience = 0;
          let monthsExperience = 0;

          if (instructorData.instructingSince) {
            const startDate = new Date(
              instructorData.instructingSince.year,
              new Date(Date.parse(instructorData.instructingSince.month + " 1, 2000")).getMonth()
            );
            const today = new Date();
            const diffTime = Math.abs(today - startDate);
            const totalMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
            yearsExperience = Math.floor(totalMonths / 12);
            monthsExperience = totalMonths % 12;
          }

          // Calculate discounted prices
          const baseRate = instructorData.pricing?.marketplaceLessonRate || 80;
          const price6hrs = baseRate * 0.95; // 5% discount
          const price10hrs = baseRate * 0.90; // 10% discount
          const testPackageRate = instructorData.pricing?.marketplaceTestPackageRate || 225;

          const transformedInstructor = {
            ...instructorData,
            id: instructorData._id,
            name: `${instructorData.user?.firstName} ${instructorData.user?.lastName}`.trim(),
            pricePerHour: baseRate,
            price6hrs: price6hrs,
            price10hrs: price10hrs,
            testPackageRate: testPackageRate,
            rating: instructorData.stats?.averageRating || 0,
            reviewCount: instructorData.stats?.totalReviews || 0,
            completedLessons: instructorData.stats?.totalLessons || 0,
            location: instructorData.serviceArea?.suburbs?.[0] || 'Unknown',
            transmission: instructorData.vehicle?.transmission || 'Auto',
            transmissionOffered: instructorData.vehicle?.transmissionOffered || 'auto',
            vehicle: `${instructorData.vehicle?.year || ''} ${instructorData.vehicle?.make || ''} ${instructorData.vehicle?.model || ''}`.trim(),
            ancapRating: instructorData.vehicle?.ancapRating || '5 Stars',
            hasDualControls: instructorData.vehicle?.hasDualControls !== false,
            bio: instructorData.bio || '',
            yearsExperience,
            monthsExperience,
            languages: instructorData.languages || ['English'],
            services: instructorData.services || [],
            specialties: instructorData.profileInfo?.specialties || [],
            gender: instructorData.gender || 'male'
          };
          setInstructor(transformedInstructor);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setLoading(false);
      }
    };

    if (id) {
      fetchInstructor();
    }
  }, [id]);

  // Fetch reviews data
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(
          `${API_URL}/reviews/instructor/${id}?page=${pagination.currentPage}&limit=5`,
          {
            headers: getHeaders(false)
          }
        );

        const data = await response.json();

        if (data.success) {
          setReviews(data.data || []);
          setPagination({
            currentPage: data.pagination?.currentPage || 1,
            totalPages: data.pagination?.totalPages || 1,
            totalReviews: data.pagination?.totalReviews || 0
          });
        }

        setReviewsLoading(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id, pagination.currentPage]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading instructor profile...</p>
          </div>
        </div>
      </div>
    );
  }

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
                {instructor.bio ? (
                  <>
                    <div className={`bio-text ${showFullBio ? 'expanded' : ''}`}>
                      <p>
                        {showFullBio ? instructor.bio : `${instructor.bio.substring(0, 300)}...`}
                      </p>
                    </div>
                    {instructor.bio.length > 300 && (
                      <button
                        className="btn-show-more"
                        onClick={() => setShowFullBio(!showFullBio)}
                      >
                        {showFullBio ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bio-text">
                    <p>No bio available for this instructor.</p>
                  </div>
                )}

                {/* Instructor Details */}
                <div className="instructor-details">
                  <div className="detail-item">
                    <FaCar className="detail-icon" />
                    <span>
                      {instructor.transmissionOffered === 'both'
                        ? 'Auto & Manual Lessons'
                        : instructor.transmissionOffered === 'manual'
                        ? 'Manual Lessons'
                        : 'Auto Lessons'}
                      {instructor.services?.some(s => s.includes('test package')) && ' & '}
                      {instructor.services?.some(s => s.includes('test package')) && <strong>Test Packages</strong>}
                    </span>
                  </div>
                  {instructor.verification?.backgroundCheckComplete && (
                    <div className="detail-item">
                      <FaCheckCircle className="detail-icon" />
                      <span>Verified Working with Children Check</span>
                    </div>
                  )}
                  {instructor.verification?.licenceVerified && (
                    <div className="detail-item">
                      <FaIdCard className="detail-icon" />
                      <span>Driving Instructor's Licence</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <FaClock className="detail-icon" />
                    <span>Instructed for {instructor.yearsExperience} yr. {instructor.monthsExperience} mo.</span>
                  </div>
                </div>

                {/* Languages */}
                <div className="languages-section">
                  <h3>Spoken language(s)</h3>
                  <div className="language-badges">
                    {instructor.languages && instructor.languages.length > 0 ? (
                      instructor.languages.map((language, index) => (
                        <span key={index} className="language-badge">{language}</span>
                      ))
                    ) : (
                      <span className="language-badge">English</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Reviews Section */}
              <section className="profile-section reviews-section">
                <h2>Reviews ({pagination.totalReviews})</h2>
                {reviewsLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <>
                    {reviews.map((review, index) => (
                      <div key={review.id || index} className="review-item">
                        <div className="review-header">
                          <div className="review-info">
                            <h4>{review.name}</h4>
                            <span className="review-date">Posted on {review.date}</span>
                          </div>
                          <div className="review-stars">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        {review.title && <h5 className="review-title">{review.title}</h5>}
                        <p className="review-comment">{review.comment}</p>
                        {review.instructorResponse && (
                          <div className="instructor-response">
                            <strong>Instructor Response:</strong>
                            <p>{review.instructorResponse.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="pagination">
                        {pagination.currentPage > 1 && (
                          <button
                            className="page-btn"
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                          >
                            ‹ Previous
                          </button>
                        )}

                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            pageNum === 1 ||
                            pageNum === pagination.totalPages ||
                            (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                className={`page-btn ${pagination.currentPage === pageNum ? 'active' : ''}`}
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === pagination.currentPage - 2 ||
                            pageNum === pagination.currentPage + 2
                          ) {
                            return <span key={pageNum} className="page-ellipsis">...</span>;
                          }
                          return null;
                        })}

                        {pagination.currentPage < pagination.totalPages && (
                          <button
                            className="page-btn"
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                          >
                            Next ›
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-reviews">
                    <p>No reviews yet for this instructor.</p>
                  </div>
                )}
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

                {instructor.services?.some(s => s.includes('test package')) && (
                  <div className="pricing-section">
                    <div className="price-row">
                      <span className="price-label">
                        Test Package (2.5 hrs) <FaInfoCircle className="info-icon-small" />
                      </span>
                      <span className="price-value">${instructor.testPackageRate}</span>
                    </div>
                  </div>
                )}

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
                    <h4>{instructor.vehicle || 'Vehicle information not available'}</h4>
                    {instructor.ancapRating && <p>{instructor.ancapRating} ANCAP rating</p>}
                    {instructor.hasDualControls && <p>Dual controls fitted</p>}
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
