import React from 'react';
import { useNavigate } from 'react-router-dom';

const Section = ({
  image,
  video,
  imageTitle,
  isHero = false, 

  textTitle,
  textContent,
  listItems,
  buttonText,
  buttonLink
}) => {
  const navigate = useNavigate();

  return (
    <div className={`section-wrapper ${isHero ? 'hero-wrapper' : ''}`}>
      {/* --- The Image Block --- */}
      {/* This div now ALWAYS gets the background image, serving as our fallback/poster */}
      <div className="section-image-block" style={{ backgroundImage: `url(${image})` }}>
        <div className="section-overlay"></div>
        
        {/* We conditionally render the video tag INSIDE this block */}
        {isHero && video && (
          <video
            className="section-video"
            src={video}
            autoPlay
            loop
            muted
            playsInline 
          ></video>
        )}

        <div className="section-image-title-content">
          {imageTitle}
        </div>
      </div>

      {/* --- The Text Block (remains the same) --- */}
      <div className="section-text-block">
        <div className="text-content-wrapper">
          <h2>{textTitle}</h2>
          <p>{textContent}</p>
          {listItems && (
            <ul>
              {listItems.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          )}
          {buttonText && (
            <button onClick={() => navigate(buttonLink)}>{buttonText}</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Section;