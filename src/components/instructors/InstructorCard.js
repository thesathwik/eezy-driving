import React from 'react';
import { Link } from 'react-router-dom';
import { FaTrophy, FaBolt, FaStar } from 'react-icons/fa';
import './InstructorCard.css';

const InstructorCard = ({ instructor }) => {
  // Extract data from real API structure
  const firstName = instructor.user?.firstName || '';
  const lastName = instructor.user?.lastName || '';
  const name = `${firstName} ${lastName}`.trim() || 'Unknown';
  const rating = instructor.stats?.averageRating || 0;
  const reviewCount = instructor.stats?.totalReviews || 0;
  const completedLessons = instructor.stats?.totalLessons || 0;
  const pricePerHour = instructor.pricing?.marketplaceLessonRate || 0;
  const photo = instructor.profileInfo?.photo || null;
  const carPhoto = instructor.vehicle?.photos?.[0] || null;
  const vehicle = `${instructor.vehicle?.make || ''} ${instructor.vehicle?.model || ''}`.trim();
  const transmission = instructor.vehicle?.transmission || '';

  // Badges
  const isTopRated = rating >= 4.8;
  const isHighDemand = completedLessons >= 1000;

  // Get initials for avatar
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="instructor-card-ez">
      {/* Badges */}
      <div className="instructor-badges">
        {isTopRated && (
          <span className="badge badge-top"><FaTrophy /> Top Instructor</span>
        )}
        {isHighDemand && (
          <span className="badge badge-demand"><FaBolt /> High Demand</span>
        )}
      </div>

      {/* Profile and Car Photos */}
      <div className="instructor-photos">
        <div className="photo-circle instructor-photo">
          {photo ? (
            <img src={photo} alt={name} />
          ) : (
            <div className="avatar-placeholder">{getInitials()}</div>
          )}
        </div>
        <div className="photo-circle car-photo">
          {carPhoto ? (
            <img src={carPhoto} alt={`${vehicle} ${transmission}`} />
          ) : (
            <div className="avatar-placeholder">🚗</div>
          )}
        </div>
      </div>

      {/* Instructor Name */}
      <h3 className="instructor-name">{name}</h3>

      {/* Rating */}
      <div className="instructor-rating-ez">
        <span className="rating-stars"><FaStar /></span>
        <span className="rating-value">{rating.toFixed(1)}</span>
        <span className="rating-dot">·</span>
        <span className="rating-count">{reviewCount} Rating{reviewCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Completed Lessons */}
      <div className="completed-lessons">
        {completedLessons} Completed Lesson{completedLessons !== 1 ? 's' : ''}
      </div>

      {/* Price */}
      <div className="instructor-price-ez">
        ${pricePerHour.toFixed(2)}/hr
      </div>

      {/* Book Button */}
      <Link to={`/book/${instructor._id}`} className="btn-book-online">
        Book Online Now
      </Link>

      {/* Action Buttons */}
      <div className="instructor-actions-ez">
        <Link to={`/instructors/${instructor._id}`} className="btn-action">
          View Profile
        </Link>
        <Link to={`/instructors/${instructor._id}/availability`} className="btn-action">
          Availability
        </Link>
      </div>
    </div>
  );
};

export default InstructorCard;
