import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">EEZYDRIVING</h3>
            <p className="footer-description">
              Your trusted platform for connecting with professional driving instructors.
              Learn to drive with confidence.
            </p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">Facebook</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">Twitter</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>For Learners</h4>
            <ul>
              <li><Link to="/instructors">Find Instructors</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/resources">Learning Resources</Link></li>
              <li><Link to="/login/learner">Learner Login</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>For Instructors</h4>
            <ul>
              <li><Link to="/instructor-signup">Become an Instructor</Link></li>
              <li><Link to="/instructor-benefits">Benefits</Link></li>
              <li><Link to="/login/instructor">Instructor Login</Link></li>
              <li><Link to="/instructor-faq">Instructor FAQ</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/safety">Safety Guidelines</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 EEZYDRIVING. All rights reserved.</p>
          <p>Making learning to drive easy, one lesson at a time.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
