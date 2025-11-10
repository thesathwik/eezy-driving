import React, { useState, useEffect } from 'react';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import InstructorCard from '../components/instructors/InstructorCard';
import { getHeaders } from '../config/api';
import './Home.css';

const Home = () => {
  const [featuredInstructors, setFeaturedInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedInstructors();
  }, []);

  const fetchFeaturedInstructors = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/instructors?limit=3`, {
        headers: getHeaders(false)
      });

      const data = await response.json();

      if (data.success) {
        setFeaturedInstructors(data.data.slice(0, 3));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching featured instructors:', err);
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <Hero />
      <HowItWorks />

      {featuredInstructors.length > 0 && (
        <section className="featured-instructors section">
          <div className="container">
            <div className="section-title">
              <h2>Top Rated Instructors</h2>
              <p>Meet our highly-rated professional instructors</p>
            </div>
            <div className="instructors-grid">
              {featuredInstructors.map(instructor => (
                <InstructorCard key={instructor._id} instructor={instructor} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Testimonials />
      <FAQ />
    </div>
  );
};

export default Home;
