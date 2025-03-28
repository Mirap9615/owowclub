import React, { useState, useEffect } from 'react';
import './Mail.css'; 
import './EventMailer.css'

const recipientGroupLabels = {
  all: 'All Members',
  founding: 'Founder Members',
  standard: 'Standard Members',
  travel: 'Travel Hosts',
  admins: 'Admins',
  testing: 'Testing Team',
};

const EventMailer = ({ event, onClose }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  function formatUtcDateTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const [hour, minute] = timeStr.split(':');
    const local = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute));
    return local.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }  

  useEffect(() => {
    if (event) {
      const date = new Date(event.event_date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
  
      const startUtc = formatUtcDateTime(event.event_date, event.start_time);
      const endUtc = formatUtcDateTime(event.event_date, event.end_time);
  
      const dynamicTitle = event.title;
      const dynamicDescription = event.description || '';
      const dynamicLocation = `${event.location}, ${event.city}, ${event.state}`;
  
      const googleCalLink = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(dynamicTitle)}&dates=${startUtc}/${endUtc}&details=${encodeURIComponent(dynamicDescription)}&location=${encodeURIComponent(dynamicLocation)}`;
  
      setSubject(`Upcoming Event: ${event.title} on ${date}`);
      setBody(`
        This is a reminder that <strong>${event.title}</strong> is scheduled for <strong>${date}</strong>. 

        <p><strong>Location:</strong> ${dynamicLocation}</p>
        <p><strong>Time:</strong> ${formatTime(event.start_time)} - ${formatTime(event.end_time)}</p>
        <p><strong>Exclusivity:</strong> ${event.exclusivity}</p>

        <p><strong>Description:</strong></p>
        <p>${dynamicDescription.replace(/\n/g, '<br/>')}</p>
        <p>
          <a href="${googleCalLink}" target="_blank" rel="noopener noreferrer">
            ➕ Add to Google Calendar
          </a>
        </p>
      `);
    }
  }, [event]);  

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const adjusted = h % 12 || 12;
    return `${adjusted}:${minute} ${period}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!subject.trim() || !body.trim()) {
      setErrorMessage('Subject and body are required.');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, recipientGroup }),
      });

      if (response.ok) {
        setSuccessMessage('Email sent successfully.');
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Failed to send email.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while sending the email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content event-mailer-modal">
        <div className="event-mailer-header">
            <h2 className="event-mailer-title">Draft Announcement Email</h2>
        </div>

        <div className="mail-layout modal-mail-layout">
          <div className="mail-input-panel">
            <div className="event-mailer-form-group">
              <label>Send Communications To:</label>
              <select
                value={recipientGroup}
                onChange={(e) => setRecipientGroup(e.target.value)}
                required
              >
                {Object.entries(recipientGroupLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {errorMessage && <p className="error">{errorMessage}</p>}
            {successMessage && <p className="success">{successMessage}</p>}

            <form onSubmit={handleSubmit}>
                <div className="event-mailer-form-group event-mailer-subject-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="event-mailer-input"
                  required
                />
              </div>

              <div className="event-mailer-form-group event-mailer-body-group">
                <label>Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="event-mailer-input"
                  rows="15"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="send-button"
              >
                {isSending ? 'Sending...' : 'Send Email'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="cancel-button"
                >
                    Cancel
                </button>
            </form>
          </div>

          <div className="mail-divider" />

          <div className="mail-preview-panel">
            <h3>Preview</h3>
            <div className="preview-box">
              <p>Dear {recipientGroupLabels[recipientGroup]}, </p>
              <h4>{subject}</h4>
              <div
                className="email-preview"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventMailer;
