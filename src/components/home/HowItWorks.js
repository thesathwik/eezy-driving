import React from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: 'SEARCH',
      title: 'Browse Instructors',
      description: 'Search through verified instructors in your area. Compare ratings, reviews, vehicle types, and availability to find your perfect match.',
      features: ['View instructor profiles', 'Check ratings & reviews', 'Compare prices']
    },
    {
      number: '02',
      icon: 'BOOK',
      title: 'Book Your Lessons',
      description: 'Schedule lessons that fit your timetable. Choose single lessons or complete packages. Book instantly online 24/7 with flexible payment options.',
      features: ['Instant online booking', 'Flexible scheduling', 'Secure payments']
    },
    {
      number: '03',
      icon: 'DRIVE',
      title: 'Get Your Licence',
      description: 'Learn from experienced professionals with structured lessons. Track your progress, log your hours, and book your driving test when you\'re ready.',
      features: ['Structured learning', 'Progress tracking', 'Test packages available']
    }
  ];

  return (
    <section className="how-it-works section">
      <div className="container">
        <div className="section-title">
          <h2>How It Works</h2>
          <p>Get started in three simple steps</p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <ul className="step-features">
                {step.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {index < steps.length - 1 && (
                <div className="step-connector">→</div>
              )}
            </div>
          ))}
        </div>

        <div className="cta-section">
          <h3>Ready to start your driving journey?</h3>
          <p>Join thousands of learners who have successfully obtained their licence through our platform</p>
          <button className="btn btn-cta">
            Find Your Instructor Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
