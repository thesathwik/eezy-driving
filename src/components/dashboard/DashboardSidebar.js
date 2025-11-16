import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './DashboardSidebar.css';

const DashboardSidebar = () => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          to="/instructor/dashboard"
          className={`nav-item ${isActive('/instructor/dashboard') ? 'active' : ''}`}
        >
          <span className="nav-icon">⊙</span>
          <span className="nav-label">Dashboard</span>
        </Link>

        <Link
          to="/instructor/calendar"
          className={`nav-item ${isActive('/instructor/calendar') ? 'active' : ''}`}
        >
          <span className="nav-icon">□</span>
          <span className="nav-label">Calendar</span>
        </Link>

        <Link
          to="/instructor/learners"
          className={`nav-item ${isActive('/instructor/learners') ? 'active' : ''}`}
        >
          <span className="nav-icon">⊕</span>
          <span className="nav-label">Learners</span>
        </Link>

        <Link
          to="/instructor/reports"
          className={`nav-item ${isActive('/instructor/reports') ? 'active' : ''}`}
        >
          <span className="nav-icon">▥</span>
          <span className="nav-label">Reports</span>
        </Link>

        <div className="nav-item-expandable">
          <button
            className={`nav-item ${settingsOpen ? 'active' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <span className="nav-icon">⚙</span>
            <span className="nav-label">Settings</span>
            <span className={`nav-arrow ${settingsOpen ? 'open' : ''}`}>▼</span>
          </button>
          {settingsOpen && (
            <div className="nav-submenu">
              <Link to="/instructor/settings?tab=personal" className="nav-subitem">
                Personal Details
              </Link>
              <Link to="/instructor/settings?tab=profile" className="nav-subitem">
                Profile
              </Link>
              <Link to="/instructor/settings?tab=vehicle" className="nav-subitem">
                Vehicle
              </Link>
              <Link to="/instructor/settings?tab=service-area" className="nav-subitem">
                Service Area
              </Link>
              <Link to="/instructor/settings?tab=hours" className="nav-subitem">
                Opening Hours
              </Link>
              <Link to="/instructor/settings?tab=pricing" className="nav-subitem">
                Pricing
              </Link>
              <Link to="/instructor/settings?tab=banking" className="nav-subitem">
                Banking
              </Link>
            </div>
          )}
        </div>

        <div className="sidebar-divider"></div>

        <Link to="/feedback" className="nav-item">
          <span className="nav-icon">✎</span>
          <span className="nav-label">Give Feedback</span>
        </Link>

        <Link to="/support" className="nav-item">
          <span className="nav-icon">?</span>
          <span className="nav-label">Support</span>
        </Link>

        <Link to="/contact" className="nav-item">
          <span className="nav-icon">☎</span>
          <span className="nav-label">Contact</span>
        </Link>
      </nav>

      <div className="sidebar-rewards">
        <div className="rewards-card">
          <div className="rewards-label">EezyRewards</div>
          <div className="rewards-amount">Earn $500</div>
          <Link to="/refer" className="rewards-link">
            Refer instructors to EEZYDRIVING →
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
