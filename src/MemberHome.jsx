import React from 'react';
import Steamed from './Steamed.jsx'

const MemberHome = () => {
  return (
    <>
        <Steamed />
        <div>
            <h2>Member's Home Page</h2>
            <p>Welcome! You have access to this page because you are logged in.</p>
        </div>
    </>
  );
};

export default MemberHome;
