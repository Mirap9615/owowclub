import React from 'react';
import Steamed from './Steamed.jsx';
import bg from './assets/bg_v2.jpg';
import './Home.css';

const Home = () => {
  return (
    <>
     <div className="home-page">
      <Steamed />
        <header className="top-bar-home">
          <h1>Welcome to OWL<sup>2</sup>!</h1>
        </header>
        <div className="home-container">
          <img src={bg} alt="background" className="background-image" />
          <div className="island">
            <h3 className="island-title">This is your sanctuary.</h3>
            <p className="island-description">
              Here, we celebrate the beauty of living fully without worry. A place to bond, laugh, and experience the fullness of life with no strings attached.
            </p>
          </div>

          <div className="island-mobile">
            <h3 className="island-title">Welcome to OWL<sup>2</sup>!</h3>
            <h4 className="island-subtitle">This is your sanctuary.</h4>
            <p className="island-description">
              Here, we celebrate the beauty of living fully without worry. A place to bond, laugh, and experience the fullness of life with no strings attached.
            </p>
          </div>
        </div>
        <footer className="bottom-bar">
          <div className="bottom-bar-content">
            <h2>Explore More</h2>
            <button>Membership</button>
            <button>Activities</button>
          </div>
        </footer>
     </div>
    </>
  );
};

export default Home;
