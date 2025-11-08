import React from 'react';
import './DashboardStats.css';

const DashboardStats = ({ stats }) => {
  return (
    <div className="dashboard-stats">
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Earnings</span>
          <span className="stat-icon">$</span>
        </div>
        <div className="stat-value">${stats.earnings.toFixed(2)}</div>
        <div className="stat-footer">
          <a href="/payouts" className="stat-link">
            Your next payout: {stats.nextPayout} →
          </a>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Cancellation Rate</span>
        </div>
        <div className="stat-value">{stats.cancellationRate.toFixed(1)}%</div>
        <div className="stat-footer">
          <a href="/cancellations" className="stat-link">
            Your cancels in the last 90 days →
          </a>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Booking hours per learner</span>
        </div>
        <div className="stat-value">{stats.bookingHoursPerLearner.toFixed(2)}</div>
        <div className="stat-footer stat-note">
          Excludes new learners (within 90 days)
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-label">Learner rating</span>
        </div>
        <div className="stat-value">{stats.learnerRating.toFixed(1)}</div>
        <div className="stat-footer">
          <a href="/reviews" className="stat-link">
            Your reviews →
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
