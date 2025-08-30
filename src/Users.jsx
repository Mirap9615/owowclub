import React, { useEffect, useState } from 'react';
import Steamed from './Steamed.jsx'
import './Users.css'

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handlePrivilegeChange = async (userId, newType) => {
    try {
      const response = await fetch(`/api/users/${userId}/privilege`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: newType }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.user_id === userId ? { ...user, type: newType } : user
          )
        );
      } else {
        console.error('Failed to update privilege');
      }
    } catch (error) {
      console.error('Error updating privilege:', error);
    }
  };

  const handlePasswordReset = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/reset-password-to-temp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'owlsquared' }),
      });

      if (response.ok) {
        alert('Password reset to owlsquared');
      } else {
        console.error('Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  return (
    <div className="home-users-panel">
        <>
        <header className="top-bar-home">
          <Steamed />
        </header>
        <div className="users-table">
            <h1>User Management</h1>
            <table border="1" cellPadding="10">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Privilege</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.user_id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                        <select
                        value={user.type}
                        onChange={(e) => handlePrivilegeChange(user.user_id, e.target.value)}
                        >
                        <option value="Founding">Founding</option>
                        <option value="Standard">Standard</option>
                        <option value="Travel Host">Travel Host</option>
                        </select>
                    </td>
                    <td>
                        <button onClick={() => handlePasswordReset(user.user_id)}>Reset Password To 'owlsquared'</button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </>
    </div>
  );
};

export default Users;