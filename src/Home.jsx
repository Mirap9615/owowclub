import React from 'react';
import { useNavigate } from 'react-router-dom';
import Steamed from './Steamed.jsx';
import Section from './Section.jsx';

import heroVideo from './assets/home/heroine-video.mp4';
import gatherImage from './assets/home/gather-image.png';
import showcaseImage from './assets/home/showcase-image.png';
import travelImage from './assets/home/travel-image.png';
import owlLogo from './assets/home/owl-logo.png';

import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page-wrapper">
      <header className="top-bar-home">
        <Steamed />
        <h1>OWL<sup>2</sup> Club</h1>
      </header>

      <main>
        {/* The Hero is just the first Section with an isHero flag */}
        <Section
          isHero={true}
          video={heroVideo}
          imageTitle={
            <>
              <img src={owlLogo} alt="OWL Club Logo" className="hero-logo" />
              RELAXING & RECHARGING. CREATING & CELEBRATING.
              <br />
              OFF-WORK TIME JUST FOR OURSELVES
            </>
          }
          textTitle="Founded by a group of women business leaders..."
          textContent="OWL² CLUB is a membership-based community that offers a safe and supportive space for women executives to embrace and express their off-work selves."
          buttonText="Membership"
          buttonLink="/membership"
        />

        {/* --- GATHER SECTION --- */}
        <Section
          image={gatherImage}
          imageTitle="GATHER & CREATE"
          textTitle="We believe that happiness is rooted in creation."
          textContent="At OWL² CLUB, you'll reconnect with your creative, off-work self through monthly and quarterly activities alongside like-minded members. Together, we make, learn, and enjoy."
          listItems={['Art', 'Writing', 'Media', 'AI tools', 'Performance', 'Golf', 'Gardening', 'Culinary culture', 'Meditation', '...and so much more']}
        />

        {/* --- SHOWCASE SECTION --- */}
        <Section
          image={showcaseImage}
          imageTitle="SHOWCASE"
          textTitle="We celebrate who we are and what we create."
          textContent="At OWL² CLUB, members' creative works are displayed, experienced, and admired through our quarterly showcase events. Whether online or in person, we provide a safe and supportive environment to honor your creativity."
          listItems={['Artwork exhibitions', 'Video and film screenings', 'Website reviews', 'Book and poetry readings', 'Tea and wine tastings', '...and so much more']}
        />
        
        {/* --- TRAVEL SECTION --- */}
        <Section
          image={travelImage}
          imageTitle="TRAVEL"
          textTitle="Forever curious and unafraid of the unknown, we are a community of global explorers."
          textContent="To support our members' love for travel, OWL² CLUB offers exclusive access to in-network private vacation homes around the world—at deeply discounted rates."
          listItems={['Hawaii', 'New York', 'Las Vegas', 'Carmel', 'Tokyo', 'Hong Kong', '...and so much more']}
        />
      </main>

      <footer className="site-footer">
        <div className="footer-content-wrapper">
          <div className="footer-brand">
            <h4>OWL² Club</h4>
          </div>
          <div className="footer-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-of-service">Terms of Service</a>
            <a href="/contact">Contact Us</a>
          </div>
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} OWL² Club. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;