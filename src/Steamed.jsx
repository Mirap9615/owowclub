import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import checkAuth from './CheckAuth.jsx';
import './Steamed.css';

const Steamed = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const authStatus = await checkAuth();
      setIsLoggedIn(authStatus.authenticated);
      if (authStatus.authenticated) {
        setUsername(authStatus.user.name);
        setAdmin(authStatus.user.admin);
      }
    };
    checkLoginStatus();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsLoggedIn(false);
        navigate('/login');
      } else {
        alert('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Logout failed');
    }
  };

  return (
    <div>
      <div className={`hamburger-menu-container ${isOpen ? 'menu-active' : ''}`}>
        <button className={`hamburger-button ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span className="burger">&#9776;</span> <span className="menu-text">Menu</span>
        </button>
      </div>
      <div className={`menu ${isOpen ? 'menu-active' : ''}`}>
        {isLoggedIn ? (
          <>
            <div className="another-section">
              <div className="section-label">Members' Section</div>
              <a href="/home">Home</a>
              <a href="/events">Events</a>
              <a href="/gallery">Gallery</a>
              <a href="/settings">Settings</a>
              <a href="#" onClick={handleLogout}>Logout</a>
              <div className="logged-in-info">Logged in as {username}</div>
            </div>


            <div className="another-section">
              <div className="section-label">Info Section</div>
              <a href="/about">About</a>
              <a href="/membership">Membership</a>
            </div>

            {isAdmin &&
              <div className="another-section">
                <div className="section-label">Admin</div>
                <a href="/admin">Admin Panel</a>
              </div>
            }


          </>
        ) : (
          <>
            <a href="/home">Home</a>
            <a href="/about">About</a>
            <a href="/membership">Membership</a>
            <a href="/activities">Activities</a>
            <a href="/login">Login</a>
          </>
        )}
      </div>
      <div className={`backdrop ${isOpen ? 'backdrop-active' : ''}`} onClick={toggleMenu}></div>
    </div>
  );
};

export default Steamed;
