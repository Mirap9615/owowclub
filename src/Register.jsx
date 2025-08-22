import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Register = () => {
  const { token } = useParams(); 
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/register/validate-token/${token}`);
        if (response.ok) {
          const data = await response.json();
          setEmail(data.email); 
          setIsValidToken(true);
        } else {
          setErrorMessage('Invalid or expired token. Please request a new invitation.');
        }
      } catch (error) {
        setErrorMessage('Error verifying token. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!name) {
      setErrorMessage('Name is required.');
      return;
    }

    if (!type) {
      setErrorMessage('Account type is required.');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name, type }),
      });

      if (response.ok) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Error creating account.');
      }
    } catch (error) {
      setErrorMessage('Error creating account. Please try again later.');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isValidToken) {
    return <p>{errorMessage}</p>;
  }

  return (
    <>
      <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
      </header>
      <div className="register-container">
      <h2>Create Your Account</h2>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} disabled readOnly />
        </div>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Account Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value="" disabled>Select account type</option>
            <option value="Founding">Founding</option>
            <option value="Standard">Standard</option>
            <option value="Travel Host">Travel Host</option>
          </select>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Account</button>
      </form>
    </div>
    </>
  );
};

export default Register;