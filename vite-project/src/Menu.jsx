import React, { useState } from 'react';
import './MenuItem.jsx'
import './Menu.css';

function Menu() {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  return (
    <div className="menu-container"
         onMouseEnter={() => setIsDropdownVisible(true)}
         onMouseLeave={() => setIsDropdownVisible(false)}>
      <button className="menu-button">Menu</button>
      {isDropdownVisible && (
        <div className="dropdown">
          <a href="/home" className="dropdown-item">Home</a>
          <a href="/about" className="dropdown-item">About</a>
          <a href="/activities" className="dropdown-item">Activities</a>
        </div>
      )}
    </div>
  );
}

export default Menu;