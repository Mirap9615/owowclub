import React, { useState } from 'react';
import './Register.css';
import Steamed from './Steamed.jsx'

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');
  
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword || !type) {
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
        body: JSON.stringify({ name: username, email, type, password }),
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
                    <label>Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="Founding">Founding</option>
                    <option value="Standard">Standard</option>
                    <option value="Travel Host">Travel Host</option>
                    </select>
                </div>
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
