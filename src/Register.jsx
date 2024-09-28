import React, { useState } from 'react';
import './Register.css';
import Steamed from './Steamed.jsx';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword || !invitationCode) {
        setError('All fields are required.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format.');
      return;
    }

    if (password.length < 6 || password.length > 30) {
        setError('Password length must be between 6 and 30 characters.');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username, email, invitationCode, password }),
      });

      if (response.ok) {
        alert('Registration successful');
        window.location.href = '/login'; 
      } else {
        const data = await response.json();
        setError(data.error || 'Registration failed.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed');
    }
  };

  return (
    <>
      <Steamed />
      <div className="centerer">
        <div className="standard-container">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Invitation Code</label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
              />
            </div>
            <small className="info-text">
              Don’t have an invitation code? <br></br><a href="/request" className="link-text">Apply by filling out your application here</a>
            </small>
            {error && <div className="error">{error}</div>}
            <button type="submit" className="register-button">Register</button>
          </form>
          <button className="login-button" onClick={() => window.location.href = '/login'}>Back to Login</button>
        </div>
      </div>
    </>
  );
};

export default Register;
