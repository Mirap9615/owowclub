import React from 'react';
import './PageThree.css';
import MembershipImage from './assets/membershipImage.png';

const membershipTypes = {
  hosting: {
    title: "Hosting Member",
    benefits: [
      "Vacation house hosts",
      "Minimum 1 month per year",
      "Operational committee",
      "6-month minimum",
      "Participation in Gatherings"
    ],
    additionalBenefits: [
        "Free vacation housing",
        "Free participation in gathering activites",
        "Free exhibition of own creations"
    ]
  },
  executive: {
    title: "Executive Member",
    benefits: [
      "Operational committees",
      "Host weekly and monthly gatherings",
      "Administrative duties",
      "6-month minimum",
      "Participation in gatherings"
    ],
    additionalBenefits: [
        "80% discount on vacation housing",
        "Free participation in gathering activities",
        "Free exhibition of own creations"
    ]
  },
  flying: {
    title: "Flying Member",
    benefits: [
      "$$ annual membership fee",
      "6-month minimum",
      "Volunteering activities"
      
    ],
    additionalBenefits: [
        "Deep discount on vacation housing",
      "Free participation in gathering activities",
      "Minimum cost to exhibit own creations"
    ]
  }
};

const MembershipColumn = ({ title, benefits, additionalBenefits, titleColor, benefitsColor }) => (
    <div className="membership-column">
      <h2 className="membership-title" style={{ color: titleColor }}>{title}</h2>
      <ul className="membership-list" style={{ color: benefitsColor }}>
        {benefits.map((benefit, index) => (
          <li key={index}>{benefit}</li>
        ))}
      </ul>
      {additionalBenefits && (
        <ul className="membership-additional-list" style={{ color: benefitsColor }}>
          {additionalBenefits.map((benefit, index) => (
            <li key={index}>{benefit}</li>
          ))}
        </ul>
      )}
    </div>
  );
  

const PageThree = () => {
  return (
    <div className="page-three-container">
      <img src={MembershipImage} alt="Membership" className="membership-image" />
      <div className="memberships-container">
        <MembershipColumn title={membershipTypes.flying.title} benefits={membershipTypes.flying.benefits} additionalBenefits={membershipTypes.flying.additionalBenefits} />
        <MembershipColumn title={membershipTypes.executive.title} benefits={membershipTypes.executive.benefits} additionalBenefits={membershipTypes.executive.additionalBenefits} />
        <MembershipColumn title={membershipTypes.hosting.title} benefits={membershipTypes.hosting.benefits} additionalBenefits={membershipTypes.hosting.additionalBenefits}/>
      </div>
    </div>
  );
};

export default PageThree;
