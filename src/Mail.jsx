import React, { useState } from 'react';
import Steamed from './Steamed.jsx'
import './Mail.css';

const Mail = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recipientGroup, setRecipientGroup] = useState('all');

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
        setSubject('');
        setBody('');
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
    <>
      <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
      </header>
      <div className="mail-layout">
      <div className="mail-input-panel">
      <div className="form-group">
        <label>Send Communications To:</label>
        <select
            value={recipientGroup}
            onChange={(e) => setRecipientGroup(e.target.value)}
            required
        >
            <option value="all">All Members</option>
            <option value="founding">Founder Members</option>
            <option value="standard">Standard Members</option>
            <option value="travel">Travel Hosts</option>
            <option value="admins">Admins</option>
            <option value="testing">Testing Team</option>
        </select>
        </div>

        {errorMessage && <p className="error">{errorMessage}</p>}
        {successMessage && <p className="success">{successMessage}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows="25"
              required
            />
          </div>

          {/* Future: File attachments or image gallery selection */}

          <button
            type="submit"
            disabled={isSending}
            className="send-button"
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>

      <div className="mail-divider" />

      <div className="mail-preview-panel">
        <h2>Preview</h2>
        <div className="preview-box">
        <p><strong>To:</strong> {
            {
            all: 'All Members',
            founding: 'Founder Members',
            standard: 'Standard Members',
            travel: 'Travel Hosts',
            admins: 'Admins',
            testing: 'Testing Team'
            }[recipientGroup]
        }</p>
          <h3>{subject}</h3>
          <div
            className="email-preview"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default Mail;
