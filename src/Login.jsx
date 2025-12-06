import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import Steamed from './Steamed.jsx'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        navigate('/home');
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Login failed');
    }
  };

  const handleRegister = () => {
    window.location.href = '/register';
  };

  const handleApplication = () => {
    window.location.href = '/request';
  }

  return (
    <>
      <header className="top-bar-home">
        <Steamed />
        <h1>OWL<sup>2</sup> Club</h1>
      </header>
      <div className="login-page-wrapper">
        <div className="login-card-container">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="login-input-group">
              <label>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="login-input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="login-btn-primary">Login</button>
          </form>
          <button className="login-btn-secondary" onClick={handleApplication}>Apply with Invitation Code</button>
          <div className="login-forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
          <div className="login-google-section">
            {/* Placeholder for Google login button */}
            <button className="login-btn-google">Login with Google</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
