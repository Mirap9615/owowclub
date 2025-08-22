import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Steamed from './Steamed.jsx'
import checkAuth from './CheckAuth.jsx';
import './Admin.css'; 

const Admin = () => {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setAdmin] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const checkLoginStatus = async () => {
          const authStatus = await checkAuth();
          setIsLoggedIn(authStatus.authenticated);
          if (authStatus.authenticated) {
            setUsername(authStatus.user.name);
            setIsLoggedIn(true);
            setAdmin(authStatus.user.admin);
            if (!authStatus.user.admin) {
                navigate('/home');
            }
          } else {
            navigate('/login')
          }

        };
        checkLoginStatus();
      }, []);

    return (
    <>
        <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
        </header>
        <div className="admin-container">
            <h2>Welcome to the Admin Dashboard, {username}!</h2>
            <div className="admin-links">
            <a href="/applications" className="admin-link">View Applications</a>
            <a href="/users" className="admin-link">View Users</a>
            <a href="/mail" className="admin-link">Send Message</a>
            </div>
        </div>   
    </>
    );
};

export default Admin;
``