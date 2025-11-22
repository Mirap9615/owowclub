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
}) => {
  const [activeTab, setActiveTab] = useState('comments');
  const [editFields, setEditFields] = useState({ name: '', description: '', tags: [] });
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [lightboxToggler, setLightboxToggler] = useState(false);

  const title = 'Detailed Image View';

  useEffect(() => {
    if (currentImage) {
      setEditFields({
        description: currentImage.description || '',
        tags: currentImage.tags || [],
        event: currentImage.associated_event_id || null,
      });
    }
    console.log(currentImage);
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
    setEditFields((prev) => ({
      ...prev,
      event: eventId || null,
    }));
  };

  const saveChanges = () => {
    console.log('Saving Changes:', editFields);
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
      <div className="modal-header">
        <h2 style={{ display: 'flex', justifyContent: 'center' }}>{title}</h2>
      </div>

      <img src={currentImage.url} className="modal-image" />
      <div className="image-author">uploaded by {currentImage.author_name} on {formatDate(currentImage.upload_date)}</div>

      {/* Description Editing */}
      <div>
        <div className="large-text">Description</div>
        <div className="description-subtitle">Double-click to edit</div>
        {isEditingDescription ? (
          <div>
            <textarea
              value={editFields.description}
              onChange={(e) =>
                setEditFields((prev) => ({ ...prev, description: e.target.value }))
              }
              rows="4"
              style={{ width: '100%' }}
            />
            <button onClick={() => setIsEditingDescription(false)}>Save</button>
          </div>
        ) : (
          <div className="small-text" onDoubleClick={() => setIsEditingDescription(true)}>
            {editFields.description || 'Double-click to edit description'}
          </div>
        )}
      </div>

      {/* Event Association */}
      <div>
        <div className="large-text">Associated Event</div>
        <div>
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
        </div>
      </div>

      <div className="comment-section">
        <Comments commentableId={currentImage.image_id || currentImage.id} />
      </div>

      <div className="modal-buttons">
        <div className="modal-buttons">
          <button onClick={saveChanges}>Save Changes</button>
          <button onClick={closeModal}>Close</button>
          <button onClick={handleLightboxToggle}>Gallery Mode</button>
          {currentImage.associated_event_id && (
            <button onClick={handleSetAsCover} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
              Set as Event Cover
            </button>
          )}
        </div>
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