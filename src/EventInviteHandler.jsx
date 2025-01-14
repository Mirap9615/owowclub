import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EventInviteHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const response = await fetch(`/api/events/invite/${token}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to accept invite:', errorData);
          alert(errorData.error || 'Invalid or expired invitation');
          navigate('/events');
          return;
        }

        const data = await response.json();
        alert(`Joined '${data.event.title}' successfully!`);
        navigate(`/events/${data.event.id}`); 
      } catch (error) {
        console.error('Error accepting invite:', error);
        alert('Failed to accept invitation.');
        navigate('/events'); 
      }
    };

    acceptInvite();
  }, [token, navigate]);

  return <p>Processing your invitation...</p>;
};

export default EventInviteHandler;
