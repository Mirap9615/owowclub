import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/logout', {
      method: 'POST', 
      credentials: 'include' 
    })
    .then(response => {
      navigate('/'); 
    })
    .catch(error => {
      console.error('Logout failed:', error);
    });
  }, [navigate]);

  return (
    <div>Logging out...</div>
  );
}

export default Logout;
