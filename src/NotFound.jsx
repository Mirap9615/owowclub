import React from 'react';
import Steamed from './Steamed.jsx';
import './NotFound.css';

function NotFound() {
  return (
    <>
      <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
      </header>
      <div className="big-warning">
        404 Error <br></br><br></br> Oops! You're not supposed to be here!
      </div>
    </>
  );
}

export default NotFound;
