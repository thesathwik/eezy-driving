import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Instructors from './pages/Instructors';
import InstructorProfile from './pages/InstructorProfile';
import InstructorAvailability from './pages/InstructorAvailability';
import BookingFlow from './pages/BookingFlow';
import LearnerLogin from './pages/auth/LearnerLogin';
import InstructorLogin from './pages/auth/InstructorLogin';
import LearnerSignup from './pages/auth/LearnerSignup';
import InstructorSignup from './pages/auth/InstructorSignup';
import CompleteInstructorProfile from './pages/auth/CompleteInstructorProfile';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCalendar from './pages/instructor/InstructorCalendar';
import InstructorLearners from './pages/instructor/InstructorLearners';
import InstructorReports from './pages/instructor/InstructorReports';
import InstructorSettings from './pages/instructor/InstructorSettings';
import './styles/global.css';

function AppContent() {
  const location = useLocation();

  // Hide Navigation and Footer for dashboard pages
  const isDashboard = location.pathname.startsWith('/instructor/dashboard') ||
                      location.pathname.startsWith('/instructor/calendar') ||
                      location.pathname.startsWith('/instructor/learners') ||
                      location.pathname.startsWith('/instructor/reports') ||
                      location.pathname.startsWith('/instructor/settings') ||
                      location.pathname.startsWith('/learner/dashboard');

  return (
    <div className="App">
      {!isDashboard && <Navigation />}
      <main className={isDashboard ? 'dashboard-layout' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/instructors/:id" element={<InstructorProfile />} />
          <Route path="/instructors/:id/availability" element={<InstructorAvailability />} />
          <Route path="/book/:id" element={<BookingFlow />} />
          <Route path="/login/learner" element={<LearnerLogin />} />
          <Route path="/login/instructor" element={<InstructorLogin />} />
          <Route path="/signup/learner" element={<LearnerSignup />} />
          <Route path="/signup/instructor" element={<InstructorSignup />} />
          <Route path="/instructor/complete-profile" element={<CompleteInstructorProfile />} />
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/calendar" element={<InstructorCalendar />} />
          <Route path="/instructor/learners" element={<InstructorLearners />} />
          <Route path="/instructor/reports" element={<InstructorReports />} />
          <Route path="/instructor/settings" element={<InstructorSettings />} />
          <Route path="/signup" element={<LearnerSignup />} />
          {/* Additional routes can be added here */}
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
