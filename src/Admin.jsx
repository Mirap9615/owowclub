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
            console.log(authStatus.user);
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
        <Steamed />
        <div className="admin-container">
            <h1>Welcome to the Admin Dashboard, {username}!</h1>
            <div className="admin-links">
            <a href="/applications" className="admin-link">View Applications</a>
            <a href="/users" className="admin-link">View Privileges</a>
            </div>
        </div>   
    </>
    );
};

export default Admin;
``