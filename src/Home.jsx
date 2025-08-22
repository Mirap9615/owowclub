import React from 'react';
import { useNavigate } from 'react-router-dom';
import Steamed from './Steamed.jsx';
import bg from './assets/bg_v2.jpg';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      <div className="home-page">
        <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
        </header>

        <main className="home-container">
          <img src={bg} alt="background" className="background-image" />
          <div className="island">
            <h3 className="island-title">This is your sanctuary.</h3>
            <p className="island-description">
              Here, we celebrate the beauty of living fully without worry. A place to bond, laugh, and experience the fullness of life with no strings attached.
            </p>
          </div>
        </main>

        <footer className="bottom-bar">
          <div className="bottom-bar-content">
            <h2>Explore More</h2>
            <button onClick={() => handleNavigate('/about')}>About Us</button>
            <button onClick={() => handleNavigate('/membership')}>Membership</button>
            <button onClick={() => handleNavigate('/activities')}>Activities</button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;