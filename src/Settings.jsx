import React, { useState, useEffect } from 'react';
import Steamed from './Steamed.jsx';
import './Settings.css';

const Settings = () => {
  const [userDetails, setUserDetails] = useState({
    name: '',
    type: '',
    admin: false,
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch('/user-details', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setUserDetails(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleUpdateUserDetails = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userDetails),
      });
      if (response.ok) {
        alert('User details updated successfully');
      } else {
        alert('Failed to update user details');
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      alert('Failed to update user details');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (response.ok) {
        alert('Password updated successfully');
      } else {
        alert('Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    }
  };

  return (
    <>
      <header className="top-bar-home">
        <Steamed />
        <h1>OWL<sup>2</sup> Club</h1>
      </header>

      <div className="centerer">
        <div className="settings-container">
          <h2>Settings</h2>
          <form onSubmit={handleUpdateUserDetails}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="name"
                value={userDetails.name}
                onChange={handleChange}
                required
              />
            </div>

            {userDetails.admin && (
              <div className="input-group">
                <label>Type</label>
                <select
                  name="type"
                  value={userDetails.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Founding">Founding</option>
                  <option value="Standard">Standard</option>
                  <option value="Travel Host">Travel Host</option>
                </select>
              </div>
            )}

            <button type="submit" className="update-button">UPDATE DETAILS</button>
          </form>

          <form onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label>Old Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="update-button">UPDATE PASSWORD</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Settings;
