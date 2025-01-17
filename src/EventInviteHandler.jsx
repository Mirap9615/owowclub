import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EventInviteHandler.css';

const EventInviteHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState('loading'); // 'loading', 'success', or 'error'
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const response = await fetch(`/api/events/invite/${token}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.error || 'Invalid or expired invitation');
          return;
        }

        const data = await response.json();
        setStatus('success');
        setMessage(`Joined '${data.event.title}' successfully!`);
        setTimeout(() => navigate(`/events/${data.event.id}`), 3000); // Redirect after 3 seconds
      } catch (error) {
        setStatus('error');
        setMessage('Failed to accept invitation.');
      }
    };

    acceptInvite();
  }, [token, navigate]);

  return (
    <div className="invite-handler-container">
      {status === 'loading' && (
        <>
          <div className="loader"></div>
          <p className="invite-handler-title">Processing your invitation...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <p className="invite-handler-title">🎉 Success!</p>
          <p className="success-message">{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="invite-handler-title">❌ Oops!</p>
          <p className="error-message">{message}</p>
          <button className="invite-handler-button" onClick={() => navigate('/calendar')}>
            Back to Events
          </button>
        </>
      )}
    </div>
  );
};

export default EventInviteHandler;
