import React, { useState } from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Passed on First Attempt',
      initials: 'SJ',
      rating: 5,
      text: 'EAZYDRIVING made finding the perfect instructor so simple! My instructor was patient, professional, and helped me pass my test on the first try. The booking system was incredibly easy to use.',
      instructor: 'Michael Chen'
    },
    {
      id: 2,
      name: 'David Martinez',
      role: 'New Driver',
      initials: 'DM',
      rating: 5,
      text: 'I was nervous about learning to drive, but the instructors here are amazing. The flexible scheduling meant I could fit lessons around my work. Highly recommend!',
      instructor: 'Emma Thompson'
    },
    {
      id: 3,
      name: 'Lisa Wong',
      role: 'Recently Licensed',
      initials: 'LW',
      rating: 5,
      text: 'The platform is fantastic! Being able to see instructor ratings and reviews helped me choose the right one. The lessons were structured perfectly, and I felt confident on test day.',
      instructor: 'James Wilson'
    },
    {
      id: 4,
      name: 'Ahmed Hassan',
      role: 'Happy Learner',
      initials: 'AH',
      rating: 5,
      text: 'Best decision I made was using EAZYDRIVING. The instructors are top-notch, and the ability to book lessons online 24/7 was perfect for my busy schedule.',
      instructor: 'Sophie Anderson'
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToTestimonial = (index) => {
    setCurrentIndex(index);
  };

  return (
    <section className="testimonials section">
      <div className="container">
        <div className="section-title">
          <h2>What Our Learners Say</h2>
          <p>Real success stories from real drivers</p>
        </div>

        <div className="testimonials-carousel">
          <button
            className="carousel-button prev"
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
          >
            ‹
          </button>

          <div className="testimonial-card">
            <div className="stars">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <span key={i} className="star">★</span>
              ))}
            </div>

            <p className="testimonial-text">
              "{testimonials[currentIndex].text}"
            </p>

            <div className="testimonial-author">
              <div className="author-image">
                {testimonials[currentIndex].initials}
              </div>
              <div className="author-info">
                <h4>{testimonials[currentIndex].name}</h4>
                <p className="author-role">{testimonials[currentIndex].role}</p>
                <p className="instructor-name">
                  Instructor: {testimonials[currentIndex].instructor}
                </p>
              </div>
            </div>
          </div>

          <button
            className="carousel-button next"
            onClick={nextTestimonial}
            aria-label="Next testimonial"
          >
            ›
          </button>
        </div>

        <div className="carousel-indicators">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToTestimonial(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <div className="testimonials-stats">
          <div className="stat-box">
            <div className="stat-number">98%</div>
            <div className="stat-text">Success Rate</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">4.9/5</div>
            <div className="stat-text">Average Rating</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">10K+</div>
            <div className="stat-text">Reviews</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
