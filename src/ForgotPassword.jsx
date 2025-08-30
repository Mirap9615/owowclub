import React, { useState } from 'react';
import Steamed from './Steamed.jsx'
import './Register.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.text();
      setMessage(result);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error sending reset link.');
    }
  };

  return (
    <>
        <Steamed />
        <div className="centerer">
            <div className="standard-container">
                <h2>Forgot Password</h2>
                {message && <div className="message">{message}</div>}
                <form onSubmit={handleForgotPassword}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </div>
                    <button type="submit" className="submit-button">Send Reset Link</button>
                </form>
            </div>
        </div>
    </>
    
  );
};

export default ForgotPassword;
