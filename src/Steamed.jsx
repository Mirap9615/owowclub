import React, { useState } from 'react';
import './Steamed.css';

const Steamed = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div>
            <div className={`hamburger-menu-container ${isOpen ? 'menu-active' : ''}`}>
                <button className={`hamburger-button ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
                    <span className="burger">&#9776;</span> <span className="menu-text">Menu</span>
                </button>
            </div>
            <div className={`menu ${isOpen ? 'menu-active' : ''}`}>
                <a href="/home">Home</a>
                <a href="/about">About</a>
                <a href="/membership">Membership</a>
                <a href="/calendar">Calendar</a>
                
                <a href="/gallery">Gallery</a>
                <a href="/settings">Settings</a>
                <a href="/login">Login</a>
            </div>
            <div className={`backdrop ${isOpen ? 'backdrop-active' : ''}`} onClick={toggleMenu}></div>
        </div>
    );
};

export default Steamed;
