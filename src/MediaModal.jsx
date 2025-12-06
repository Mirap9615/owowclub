import React, { useState, useEffect } from 'react';
import './MediaModal.css';
import Modal from 'react-modal';
import Comments from './Comments.jsx';
import FsLightbox from 'fslightbox-react';

const formatDate = (isoDate) => {
  if (!isoDate) return 'unknown date';
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const MediaModal = React.memo(({
  isOpen,
  closeModal,
  currentMedia,
  onSave,
  userDetails,
}) => {
  // ... (state remains same)

  // ... (useEffects remain same)

  // ... (handlers remain same)

  // ... (render logic)


  // --- STATE ---
  const [editFields, setEditFields] = useState({ description: '', tags: [], event: null });
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [lightboxToggler, setLightboxToggler] = useState(false);

  const title = 'Detailed Media View';

  // useEffects 

  useEffect(() => {
    if (currentMedia) {
      setEditFields({
        description: currentMedia.description || '',
        tags: currentMedia.tags || [],
        event: currentMedia.associated_event_id || null,
      });
      setIsEditingDescription(false);
    }
  }, [currentMedia]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        setAvailableEvents(await response.json());
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  // --- HANDLERS ---
  const handleEventSelection = (eventId) => {
    setEditFields((prev) => ({
      ...prev,
      event: eventId || null,
    }));
  };

  const saveChanges = () => {
    onSave({ ...currentMedia, ...editFields, associatedEventId: editFields.event });
    closeModal();
  };

  const lightboxType = currentMedia?.media_type === 'video' ? 'video' : 'image';

  if (!currentMedia) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel={title}
      className="media-modal"
      overlayClassName="modal-overlay"
    >
      {/* --- HEADER --- */}
      <div className="modal-header">
        <h2>{currentMedia.name || 'Media Details'}</h2>
      </div>

      {/* --- SCROLLABLE CONTENT WRAPPER --- */}
      <div className="modal-content-wrapper">

        {/* --- Media Display (Image/Video) --- */}
        <div className="media-display-container">
          {currentMedia.media_type === 'video' ? (

            <video src={currentMedia.url} controls autoPlay className="modal-media" />
          ) : (
            <img src={currentMedia.url} alt={currentMedia.name} className="modal-media" />
          )}
        </div>

        <div className="media-author">
          Uploaded by {currentMedia.author_name || 'Unknown'} on {formatDate(currentMedia.upload_date)}
        </div>

        <div className="modal-section">
          <label className="large-text">Description</label>
          {isEditingDescription ? (
            <div className="edit-description-wrapper">
              <textarea
                value={editFields.description}
                onChange={(e) => setEditFields((prev) => ({ ...prev, description: e.target.value }))}
                rows="4"
              />
              <button onClick={() => setIsEditingDescription(false)} className="button-secondary" style={{ marginTop: '0.5rem' }}>
                Save Description
              </button>
            </div>
          ) : (
            <p
              className="small-text"
              onDoubleClick={() => userDetails?.user_id && setIsEditingDescription(true)}
              style={{ cursor: userDetails?.user_id ? 'pointer' : 'default' }}
            >
              {editFields.description || (userDetails?.user_id ? 'No description provided. Double-click to edit.' : 'No description provided.')}
            </p>
          )}
        </div>

        {/* --- Event Association --- */}
        <div className="modal-section">
          <label className="large-text">Associated Event</label>
          {userDetails?.user_id ? (
            <select
              value={editFields.event || ''}
              onChange={(e) => handleEventSelection(e.target.value)}
            >
              <option value="">(None)</option>
              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="static-text">
              {availableEvents.find(e => e.id === editFields.event)?.title || '(None)'}
            </div>
          )}
        </div>

        {/* --- Comments Section --- */}
        <div className="modal-section">
          <Comments commentableId={currentMedia.id} />
        </div>

      </div>


      {/* --- FOOTER (Fixed at the bottom) --- */}
      <div className="modal-buttons">
        {userDetails?.user_id && <button onClick={saveChanges} className="button-primary">Save & Close</button>}
        <button onClick={() => setLightboxToggler(!lightboxToggler)} className="button-secondary">
          Fullscreen
        </button>
        <button onClick={closeModal} className="button-tertiary">Cancel</button>
      </div>

      <FsLightbox
        toggler={lightboxToggler}
        sources={[currentMedia.url]}
        types={[lightboxType]}
      />
    </Modal>
  );
});

export default MediaModal;