import React from 'react';
import Steamed from './Steamed.jsx'
import bg from './assets/home_bg.jpeg';
import './Home.css';

const Home = () => {
  return (
    <>
      <Steamed />
      <div className="home-container">
        <img src={bg} alt="background" className="background-image" />
        <div className="content-container">
          <div className="main-title">
            <h3>Welcome to OWOW!</h3>
          </div>
          <div className="description">
            This site is currently under development. If you have any questions or concerns, please contact William!
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
