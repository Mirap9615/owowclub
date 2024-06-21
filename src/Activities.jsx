import React from 'react';
import './Activities.css';
import Steamed from './Steamed.jsx'
import ActivitiesTravel from './assets/aTravel.png';
import ActivitiesGathering from './assets/aGathering.png';
import ActivitiesShowcase from './assets/aShowcase.png';

const activities = {
  travel: {
    title: "TRAVEL",
    subtitle: "In-network private vacation homes around the world, with deep discounts for members",
    content: [
      "New York",
      "Carmel",
      "Maui",
      "Hong Kong",
      "Thailand",
      "Beijing",
      "Tokyo",
    ]
  },
  gathering: {
    title: "GATHERING",
    subtitle: "Meet other members in weekly and monthly activities, both in person and online",
    content: [
      "Art",
      "Writing",
      "Media",
      "Performance Arts",
      "Gardening",
      "Tea culture",
      "Meditation",
      ""
    ]
  },
  showcase: {
    title: "SHOWCASE",
    subtitle: "Highlight works created & loved by members in the community in our monthly showcases",
    content: [
      "Artwork exhibition",
      "Video/Movie viewing",
      "Book reading",
      "Tea/wine tasting",
      "Food sampling",
    ]
  }
};

const Column = ({ title, subtitle, content, imgSrc }) => (
    <div className="activity-column">
      <h2 className="activity-title">{title}</h2>
      <h3 className="activity-subtitle">{subtitle}</h3>
      {imgSrc && <img src={imgSrc} alt={title} className="activity-image" />}
      <ul className="activity-list">
        {content.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );

const Activities = () => {
  return (
    <>
      <Steamed />
      <div className="page-two-container">
      <h1 className="main-title">ACTIVITIES</h1>
      <div className="columns-container">
        <Column title={activities.travel.title} subtitle={activities.travel.subtitle} content={activities.travel.content} imgSrc={ActivitiesTravel}/>
        <Column title={activities.gathering.title} subtitle={activities.gathering.subtitle} content={activities.gathering.content} imgSrc={ActivitiesGathering}/>
        <Column title={activities.showcase.title} subtitle={activities.showcase.subtitle} content={activities.showcase.content} imgSrc={ActivitiesShowcase}/>
      </div>
    </div>
    </>
  );
};

export default Activities;
