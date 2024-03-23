import React from 'react';
import Menu from './Menu.jsx';
import './NotFound.css';

function NotFound() {
  return (
    <>
      <Menu />
      <div className="big-warning">
        404 Error <br></br><br></br><br></br> Oops! You're not supposed to be here!
      </div>
    </>
  );
}

export default NotFound;
