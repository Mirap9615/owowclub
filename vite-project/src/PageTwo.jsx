import React from 'react';
import './PageTwo.css';
import ActivitiesTravel from './assets/aTravel.png';
import ActivitiesGathering from './assets/aGathering.png';
import ActivitiesShowcase from './assets/aShowcase.png';

const activities = {
  travel: {
    title: "TRAVEL",
    content: [
      "In-network private vacation homes around the world",
      "Carmel",
      "Maui",
      "Hong Kong",
      "Thailand",
      "New York",
      "...",
      "Deep discount for members"
    ]
  },
  gathering: {
    title: "GATHERING",
    content: [
      "In person and online group activities",
      "Art",
      "Writing",
      "Media",
      "AI",
      "Gardening",
      "Tea culture",
      "Meditation",
      "...",
      "Weekly and monthly"
    ]
  },
  showcase: {
    title: "SHOWCASE",
    content: [
      "Artwork exhibition",
      "Video/Movie viewing",
      "Book reading",
      "Tea/wine tasting",
      "Food sampling",
      "...",
      "Quarterly and Annual"
    ]
  }
};

const Column = ({ title, content, imgSrc }) => (
    <div className="activity-column">
      <h2 className="activity-title">{title}</h2>
      {imgSrc && <img src={imgSrc} alt={title} className="activity-image" />}
      <ul className="activity-list">
        {content.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );

const PageTwo = () => {
  return (
    <div className="page-two-container">
      <h1 className="main-title">ACTIVITIES</h1>
      <div className="columns-container">
        <Column title={activities.travel.title} content={activities.travel.content} imgSrc={ActivitiesTravel}/>
        <Column title={activities.gathering.title} content={activities.gathering.content} imgSrc={ActivitiesGathering}/>
        <Column title={activities.showcase.title} content={activities.showcase.content} imgSrc={ActivitiesShowcase}/>
      </div>
    </div>
  );
};

export default PageTwo;
