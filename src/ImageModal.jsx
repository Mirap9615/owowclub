import React, { useState, useEffect, useCallback } from 'react';
import './ImageModal.css';
import Modal from 'react-modal';
import Comments from './Comments.jsx';
import FsLightbox from 'fslightbox-react';


const formatDate = (isoDate) => {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const ImageModal = React.memo(({
  isOpen,
  closeModal,
  currentImage,
  onSave,
  userDetails,
}) => {
  const [activeTab, setActiveTab] = useState('comments');
  const [editFields, setEditFields] = useState({ name: '', description: '', tags: [] });
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [lightboxToggler, setLightboxToggler] = useState(false);

  const title = 'Detailed Image View';

  useEffect(() => {
    if (currentImage) {
      const initialEventId = currentImage.associated_event_id || currentImage.event_id || null;
      setEditFields({
        description: currentImage.description || '',
        tags: currentImage.tags || [],
        event: initialEventId,
      });
    }
  }, [currentImage]);

  useEffect(() => {
    const fetchTagsAndEvents = async () => {
      try {
        const [tagsResponse, eventsResponse] = await Promise.all([
          fetch(`/api/media/tags/${currentImage?.title || ''}`),
          fetch('/api/events'),
        ]);

        setAvailableEvents(await eventsResponse.json());
      } catch (error) {
        console.error('Error fetching tags or events:', error);
      }
    };

    if (isOpen) {
      fetchTagsAndEvents();
    }
  }, [isOpen, currentImage?.title]);

  const handleEventSelection = (eventId) => {
    const newEventId = eventId || null;
    setEditFields((prev) => ({
      ...prev,
      event: newEventId,
    }));
    // Seamless save for event
    onSave({
      ...currentImage,
      ...editFields,
      event: newEventId,
      associated_event_id: newEventId,
      associatedEventId: newEventId // Correct field for backend
    });
  };

  const handleSaveDescription = () => {
    setIsEditingDescription(false);
    // Seamless save for description
    // Use the current editFields.event, falling back to currentImage data if needed
    const eventIdToSave = editFields.event || currentImage.associated_event_id || currentImage.event_id || null;

    const payload = {
      ...currentImage,
      ...editFields,
      description: editFields.description,
      associated_event_id: eventIdToSave,
      associatedEventId: eventIdToSave // Correct field for backend
    };

    onSave(payload);
  };

  const saveChanges = () => {
    onSave({ ...currentImage, ...editFields, associatedEventId: editFields.event, });
    closeModal();
  };

  const handleLightboxToggle = () => {
    setLightboxToggler(!lightboxToggler);
  };

  const handleSetAsCover = async () => {
    if (!currentImage.associated_event_id) return;

    try {
      const response = await fetch(`/api/events/${currentImage.associated_event_id}/cover`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cover_image_url: currentImage.url }),
      });

      if (response.ok) {
        alert('Event cover image updated successfully!');
      } else {
        console.error('Failed to update cover image');
        alert('Failed to update cover image.');
      }
    } catch (error) {
      console.error('Error updating cover image:', error);
      alert('Error updating cover image.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel={title}
      className="image-modal"
      overlayClassName="modal-overlay"
    >
      {/* --- HEADER --- */}
      <div className="modal-header">
        <h2>{title}</h2>
      </div>

      {/* --- SCROLLABLE CONTENT WRAPPER --- */}
      <div className="modal-content-wrapper">

        {/* --- Media Display --- */}
        <div className="media-display-container">
          <img src={currentImage.url} className="modal-media" alt={currentImage.title || 'Image'} />
        </div>

        <div className="image-author">
          uploaded by {currentImage.author_name} on {formatDate(currentImage.upload_date)}
        </div>

        {/* --- Description Editing --- */}
        <div className="modal-section">
          <div className="large-text">Description</div>
          {userDetails?.user_id && <div className="description-subtitle">Double-click to edit</div>}
          {isEditingDescription ? (
            <div className="edit-description-wrapper">
              <textarea
                value={editFields.description}
                onChange={(e) =>
                  setEditFields((prev) => ({ ...prev, description: e.target.value }))
                }
                rows="4"
              />
              <button onClick={handleSaveDescription} className="modal-btn-ghost" style={{ marginTop: '0.5rem' }}>
                Save Description
              </button>
            </div>
          ) : (
            <div
              className="small-text"
              onDoubleClick={() => userDetails?.user_id && setIsEditingDescription(true)}
              style={{ cursor: userDetails?.user_id ? 'pointer' : 'default' }}
            >
              {editFields.description || (userDetails?.user_id ? 'Double-click to edit description' : 'No description provided.')}
            </div>
          )}
        </div>

        {/* --- Event Association --- */}
        <div className="modal-section">
          <div className="large-text">Associated Event</div>
          {userDetails?.user_id ? (
            <select
              value={editFields.event || ''}
              onChange={(e) => handleEventSelection(e.target.value)}
            >
              <option value="">No event associated</option>
              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="static-text">
              {availableEvents.find(e => e.id === editFields.event)?.title || 'No event associated'}
            </div>
          )}
        </div>

        {/* --- Comments Section --- */}
        <div className="modal-section">
          <Comments commentableId={currentImage.image_id || currentImage.id} />
        </div>

      </div>

      {/* --- FOOTER (Fixed at the bottom) --- */}
      <div className="image-modal-buttons">
        <button className="image-modal-btn-blue" onClick={closeModal}>Close</button>
        <button className="image-modal-btn-blue" onClick={handleLightboxToggle}>Gallery Mode</button>
        {userDetails?.user_id && currentImage.associated_event_id && (
          <button className="image-modal-btn-blue" onClick={handleSetAsCover}>
            Set as Event Cover
          </button>
        )}
      </div>

      {currentImage && (
        <FsLightbox
          toggler={lightboxToggler}
          sources={[currentImage.url]}
          captions={[<>
            <h2>{currentImage.title}</h2>
            <p>Uploaded on {new Date(currentImage.upload_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} by {currentImage.author}</p>
            <p>{currentImage.description}</p>
          </>]}
          types={['image']}
        />
      )}
    </Modal>
  );
});

export default ImageModal;