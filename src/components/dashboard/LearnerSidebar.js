import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './DashboardSidebar.css';

const LearnerSidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo">
        <Link to="/">
          <h2>EEZYDRIVING</h2>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/learner/dashboard"
          className={`nav-item ${isActive('/learner/dashboard') ? 'active' : ''}`}
        >
          <span className="nav-icon">⊙</span>
          <span className="nav-label">Dashboard</span>
        </Link>

        <Link
          to="/instructors"
          className={`nav-item ${isActive('/instructors') ? 'active' : ''}`}
        >
          <span className="nav-icon">⊕</span>
          <span className="nav-label">Book a Lesson</span>
        </Link>

        <div className="sidebar-divider"></div>

        <Link to="/support" className="nav-item">
          <span className="nav-icon">?</span>
          <span className="nav-label">Support</span>
        </Link>

        <Link to="/contact" className="nav-item">
          <span className="nav-icon">☎</span>
          <span className="nav-label">Contact</span>
        </Link>
      </nav>
    </aside>
  );
};

export default LearnerSidebar;
