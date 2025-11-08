import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: 'How much does a driving lesson cost?',
      answer: 'Lesson prices vary by instructor, location, and vehicle type across Australia. On average, manual lessons range from $55-70 per hour, while automatic lessons are typically $60-75 per hour. Many instructors offer package deals that provide better value for multiple lessons.'
    },
    {
      question: 'How do I book a driving lesson?',
      answer: 'Simply search for instructors in your area using our search tool, browse their profiles, check availability, and book directly through the platform. You can pay securely online and receive instant confirmation. Changes can be made up to 24 hours before your lesson.'
    },
    {
      question: 'Can I change my instructor if I\'m not satisfied?',
      answer: 'Absolutely! We understand that finding the right instructor is important. You can switch instructors at any time without penalty. Simply book with a different instructor through the platform, and your learning hours will carry over.'
    },
    {
      question: 'What is included in a test package?',
      answer: 'Test packages typically include a pre-test warm-up lesson, use of the instructor\'s vehicle for your driving test, and pickup/drop-off service. Some instructors also include extra practice on test routes and last-minute tips.'
    },
    {
      question: 'How long does it take to get my licence?',
      answer: 'The time varies by individual and state requirements, but most learners complete their training in 3-6 months with regular lessons. In NSW, for example, you need 120 logbook hours. Professional lessons can count as bonus hours in some states. Your instructor will help you progress at your own pace.'
    },
    {
      question: 'Are all instructors verified and licenced?',
      answer: 'Yes! All instructors on EAZYDRIVING are fully licenced, accredited, and have undergone background checks including police clearances and working with children checks. We verify all credentials before approving any instructor to join our platform.'
    },
    {
      question: 'Do lessons count towards my logbook hours?',
      answer: 'Yes, all lessons with our accredited instructors count towards your required logbook hours. In some states, lessons with professional instructors may count as bonus or multiple hours. Check with your instructor for specific state requirements.'
    },
    {
      question: 'What if I need to cancel or reschedule?',
      answer: 'You can cancel or reschedule lessons up to 24 hours before the scheduled time without charge through your dashboard. Late cancellations (less than 24 hours) may incur a fee as per the instructor\'s policy. We recommend reviewing cancellation terms before booking.'
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq section bg-secondary">
      <div className="container">
        <div className="section-title">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about EAZYDRIVING</p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">{activeIndex === index ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="faq-cta">
          <h3>Still have questions?</h3>
          <p>Our support team is here to help you get started</p>
          <button className="btn btn-secondary-cta">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
