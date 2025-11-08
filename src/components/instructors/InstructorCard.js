import React from 'react';
import { Link } from 'react-router-dom';
import { FaTrophy, FaBolt, FaStar } from 'react-icons/fa';
import './InstructorCard.css';

const InstructorCard = ({ instructor }) => {
  return (
    <div className="instructor-card-ez">
      {/* Badges */}
      <div className="instructor-badges">
        {instructor.topInstructor && (
          <span className="badge badge-top"><FaTrophy /> Top Instructor</span>
        )}
        {instructor.highDemand && (
          <span className="badge badge-demand"><FaBolt /> High Demand</span>
        )}
      </div>

      {/* Profile and Car Photos */}
      <div className="instructor-photos">
        <div className="photo-circle instructor-photo">
          <img
            src={instructor.photo || '/api/placeholder/100/100'}
            alt={instructor.name}
          />
        </div>
        <div className="photo-circle car-photo">
          <img
            src={instructor.carPhoto || '/api/placeholder/100/100'}
            alt={`${instructor.vehicle} ${instructor.transmission}`}
          />
        </div>
      </div>

      {/* Instructor Name */}
      <h3 className="instructor-name">{instructor.name}</h3>

      {/* Rating */}
      <div className="instructor-rating-ez">
        <span className="rating-stars"><FaStar /></span>
        <span className="rating-value">{instructor.rating}</span>
        <span className="rating-dot">·</span>
        <span className="rating-count">{instructor.reviewCount} Ratings</span>
      </div>

      {/* Completed Lessons */}
      <div className="completed-lessons">
        {instructor.completedLessons} Completed Lessons
      </div>

      {/* Price */}
      <div className="instructor-price-ez">
        ${instructor.pricePerHour}/hr
      </div>

      {/* Book Button */}
      <Link to={`/book/${instructor.id}`} className="btn-book-online">
        Book Online Now
      </Link>

      {/* Action Buttons */}
      <div className="instructor-actions-ez">
        <Link to={`/instructors/${instructor.id}`} className="btn-action">
          View Profile
        </Link>
        <Link to={`/instructors/${instructor.id}/availability`} className="btn-action">
          Availability
        </Link>
      </div>
    </div>
  );
};

export default InstructorCard;
