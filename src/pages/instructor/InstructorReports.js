import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import { getHeaders } from '../../config/api';
import './Reports.css';

const InstructorReports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const instructorId = user?._id || user?.id;

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="dashboard-page">
        <DashboardSidebar />
        <div className="dashboard-main">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (instructorId) {
      fetchAnalytics();
      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchAnalytics, 60000);
      return () => clearInterval(interval);
    }
  }, [instructorId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/analytics/instructor/${instructorId}`,
        { headers: getHeaders(true) }
      );

      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data.summary);
      } else {
        setError(data.message || 'Failed to load analytics');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics. Please try again.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-AU').format(Math.round(num));
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].payload.month}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading && !analytics) {
    return (
      <div className="dashboard-page">
        <DashboardSidebar />
        <div className="dashboard-main">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <DashboardSidebar />
        <div className="dashboard-main">
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchAnalytics}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main">
        <div className="reports-header">
          <h1>Reports</h1>
        </div>

        {/* Tabs */}
        <div className="reports-tabs">
          <button
            className={`reports-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`reports-tab ${activeTab === 'thisYear' ? 'active' : ''}`}
            onClick={() => setActiveTab('thisYear')}
          >
            This Financial Year
          </button>
          <button
            className={`reports-tab ${activeTab === 'fy2024' ? 'active' : ''}`}
            onClick={() => setActiveTab('fy2024')}
          >
            FY 2024/25
          </button>
        </div>

        {/* Content */}
        {activeTab === 'summary' && analytics && (
          <div className="reports-content">
            {/* Top Stats Row */}
            <div className="stats-row-4">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Earnings</span>
                </div>
                <div className="stat-value">-</div>
                <div className="stat-footer">
                  <a href="#" className="stat-link">Your next payout: 24 Nov</a>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Cancellation Rate</span>
                </div>
                <div className="stat-value">{analytics.metrics.cancellationRate.toFixed(1)}%</div>
                <div className="stat-footer">
                  <a href="#" className="stat-link">Your cancels in the last 90 days</a>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Booking hours per learner</span>
                </div>
                <div className="stat-value">{analytics.metrics.bookingHoursPerLearner.toFixed(2)}</div>
                <div className="stat-footer">
                  <span className="stat-note">Excludes new learners (within 90 days)</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Learner rating</span>
                </div>
                <div className="stat-value">{analytics.metrics.learnerRating.toFixed(1)}</div>
                <div className="stat-footer">
                  <a href="#" className="stat-link">Your reviews</a>
                </div>
              </div>
            </div>

            {/* Earnings Report Chart */}
            <div className="chart-section">
              <div className="chart-header">
                <h2>Earnings report</h2>
                <p className="chart-subtitle">Your payouts by month (last 12 months)</p>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.chart.monthlyEarnings}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFC107" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="#FFC107"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEarnings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Earnings Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Next Payout</div>
                <div className="stat-sublabel">(24 Nov 2025)</div>
                <div className="stat-value-large">-</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Previous Payout</div>
                <div className="stat-sublabel">(10 Nov 2025)</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.previousPayout)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">FYTD Payout</div>
                <div className="stat-sublabel">(FY25-26)</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.fytd)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">All Time Earnings</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.allTime)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Ave Weekly Earnings</div>
                <div className="stat-sublabel">(last 90 days)</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.aveWeekly)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Ave Earnings Per Hour</div>
                <div className="stat-sublabel">(last 90 days)</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.avePerHour)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Upcoming Bookings</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.upcoming)}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Credits Held By Your Learners</div>
                <div className="stat-value-large">{formatCurrency(analytics.earnings.creditsHeld)}</div>
              </div>
            </div>

            {/* Booking Activity */}
            <div className="activity-section">
              <h2>Booking Activity</h2>
              <div className="activity-grid">
                <div className="activity-item">
                  <div className="activity-value">{formatNumber(analytics.activity.searchesInArea)}</div>
                  <div className="activity-label">Searches in your area</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{analytics.activity.testPackages}</div>
                  <div className="activity-label">Test packages</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{analytics.activity.totalBookingHours}</div>
                  <div className="activity-label">Total booking hrs</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{analytics.activity.learners}</div>
                  <div className="activity-label">Learners</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{analytics.activity.upcomingHours}</div>
                  <div className="activity-label">Upcoming hrs booked</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{analytics.activity.completedHours}</div>
                  <div className="activity-label">Lesson hrs completed</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'thisYear' && (
          <div className="reports-content">
            <div className="empty-state">
              <h3>This Financial Year</h3>
              <p>Financial year statistics and detailed breakdowns coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'fy2024' && (
          <div className="reports-content">
            <div className="empty-state">
              <h3>FY 2024/25</h3>
              <p>FY 2024/25 statistics and detailed breakdowns coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorReports;
