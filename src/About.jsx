import React from 'react';
import './About.css';
import Steamed from './Steamed.jsx';

const About = () => {
  const tagline = "Outstanding Women Outside Work";
  const highlightedTagline = tagline.split(' ').map((word, index) => (
    <React.Fragment key={index}><span className="highlighted-letter">{word[0]}</span>{word.substring(1)} </React.Fragment>
));

  return (
    <>
      <header className="top-bar-home">
            <Steamed />
            <h1>OWL<sup>2</sup> Club</h1>
        </header>
      <div className="home-about">
      <div className="page-container">
        <div className = "text-container">
            <h1 className="club-name">O'WOW<br/>CLUB</h1>
            <p className="tagline">{highlightedTagline}</p>
            
            <section className="why-section">
                <h2 className="section-title">WHY</h2>
                <ul className="list">
                <li>Women business leaders need time for themselves</li>
                <li>Resources to nurture their off-work talents</li>
                <li>Like-minded community to support each other</li>
                <li>Platform to showcase their creations <br/> <br/> </li>
                </ul>
            </section>
            
            <section className="what-section">
                <h2 className="section-title">WHAT</h2>
                <ul className="list">
                <li>Dedicated time for established women executives to</li>
                <li>Relax and recharge</li>
                <li>Find joy through creation</li>
                <li>Identify personal hobby</li>
                <li>Celebrate off-work success</li>
                <li>Support each other <br/> <br/> </li>
                </ul>
            </section>

            <section className="what-not-section">
                <h2 className="section-title">WHAT NOT</h2>
                <ul className="list">
                <li>Not a place to discuss work issues</li>
                <li>Or a place to search for jobs</li>
                <li>Or a place to mentor business professionals</li>
                <li>Or a place to share parenting experiences</li>
                <li> <br/> &zwnj; <br/> &zwnj; </li>
                </ul>
            </section>
          </div>
      </div>
      </div>
    </>
  );
};

export default About;
