import React from 'react';
import './PageOne.css';

const PageOne = () => {
  return (
    <div className="page-container">
        <div className = "text-container">
            <h1 className="club-name">O'WOW<br/>CLUB</h1>
            <p className="tagline">Outstanding Women Outside Work</p>
            
            <section className="why-section">
                <h2 className="section-title">WHY</h2>
                <ul className="list">
                <li>Women business leaders need time for themselves</li>
                <li>Resources to nurture their off-work talents</li>
                <li>Like-minded community to support each other</li>
                <li>Platform to showcase their creations</li>
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
                <li>Support each other</li>
                </ul>
            </section>

            <section className="what-not-section">
                <h2 className="section-title">WHAT NOT</h2>
                <ul className="list">
                <li>Dedicated time for established women executives to</li>
                <li>Relax and recharge</li>
                <li>Find joy through creation</li>
                <li>Identify personal hobby</li>
                <li>Celebrate off-work success</li>
                <li>Support each other</li>
                </ul>
            </section>
        </div>
    </div>
  );
};

export default PageOne;
