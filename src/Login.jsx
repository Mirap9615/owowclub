import React, { useState, useEffect } from 'react';
import { Link,  useNavigate } from 'react-router-dom';
import checkAuth from './CheckAuth.jsx';
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
        navigate('/member-home');
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

  return (
    <>
        <Steamed />
        <div className="login-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div className="input-group">
                <label>Email</label>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div className="input-group">
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
                <button type="submit" className="login-button">Login</button>
            </form>
            <button className="register-button" onClick={handleRegister}>Register</button>
            <div className="forgot-password">
                    <Link to="/forgot-password">Forgot Password?</Link>
            </div>
            <div className="google-login">
                {/* Placeholder for Google login button */}
                <button className="google-login-button">Login with Google</button>
            </div>
        </div>
    </>
  );
};

export default Login;
