import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const history = useNavigate();

  useEffect(() => {
    console.log("In the reset password page with token " + token);
  }, []);

  
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await response.text();
      setMessage(result);

      if (response.ok) {
        setTimeout(() => {
          history.push('/login'); 
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error resetting password.');
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      {message && <div className="message">{message}</div>}
      <form onSubmit={handleResetPassword}>
        <div className="input-group">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="6"
            maxLength="30"
          />
        </div>
        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="6"
            maxLength="30"
          />
        </div>
        <button type="submit" className="submit-button">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
