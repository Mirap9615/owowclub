import React from 'react';
import Steamed from './Steamed.jsx';
import './NotFound.css';

function NotFound() {
  return (
    <>
      <Steamed />
      <div className="big-warning">
        404 Error <br></br><br></br> Oops! You're not supposed to be here!
      </div>
    </>
  );
}

export default NotFound;
