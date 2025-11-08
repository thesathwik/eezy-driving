import React from 'react';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import FAQ from '../components/home/FAQ';
import InstructorCard from '../components/instructors/InstructorCard';
import { instructors } from '../data/instructors';
import './Home.css';

const Home = () => {
  // Show top 3 featured instructors
  const featuredInstructors = instructors.filter(i => i.topRated).slice(0, 3);

  return (
    <div className="home-page">
      <Hero />
      <HowItWorks />

      <section className="featured-instructors section">
        <div className="container">
          <div className="section-title">
            <h2>Top Rated Instructors</h2>
            <p>Meet our highly-rated professional instructors</p>
          </div>
          <div className="instructors-grid">
            {featuredInstructors.map(instructor => (
              <InstructorCard key={instructor.id} instructor={instructor} />
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <FAQ />
    </div>
  );
};

export default Home;
