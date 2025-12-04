import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Event.css'
import Steamed from './Steamed.jsx';
import bannerImage from './assets/banner1.jpeg';
import EventModal from './EventModal.jsx';
import ImageModal from './ImageModal.jsx';
import InviteModal from './InviteModal.jsx';
import EventMailer from './EventMailer.jsx';
import Comments from './Comments.jsx';
import { createPortal } from 'react-dom';
import { EVENT_TYPE_MAP } from './constants/eventTypes';

const JoinedModal = ({ isOpen, onClose, eventName, onSendConfirmation }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Welcome to {eventName}!</h3>
        <p>You have successfully joined the event.</p>
        <div className="modal-actions">
          <button onClick={onSendConfirmation} className="event-ghost-button">Send Confirmation Email</button>
          <button onClick={onClose} className="event-ghost-button">Close</button>
        </div>
      </div>
    </div>
  );
};

const LeaveConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Are you sure you want to leave?</h3>
        <div className="modal-actions">
          <button onClick={onConfirm} className="event-ghost-button">Yes, Leave</button>
          <button onClick={onClose} className="event-ghost-button">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, eventName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Are you sure you want to delete "{eventName}"?</h3>
        <p>This action cannot be undone.</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="event-ghost-button">
            YES, DELETE
          </button>
          <button onClick={onClose} className="event-ghost-button">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

const formatDateRead = (isoDate) => {
  if (!isoDate) return 'N/A';

  const [year, month, day] = isoDate.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
};

const EventPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventImages, setEventImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinedModalOpen, setIsJoinedModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingLeaveEventId, setPendingLeaveEventId] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState({});
  const fileInputRef = useRef(null);
  const eventRef = useRef(null);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
    setSelectedMedia({});
  }, []);

  const handleSelectMedia = useCallback((mediaUrl) => {
    setSelectedMedia(prev => ({
      ...prev,
      [mediaUrl]: !prev[mediaUrl]
    }));
  }, []);

  const handleDeleteMedia = useCallback(async () => {
    const mediaToDelete = Object.keys(selectedMedia)
      .filter(key => selectedMedia[key])
      .map(url => eventImages.find(item => item.url === url)?.id)
      .filter(id => id);

    if (mediaToDelete.length === 0) {
      console.warn('No valid media selected for deletion.');
      return;
    }

    try {
      const response = await fetch('/api/delete-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media: mediaToDelete }),
      });

      if (response.ok) {
        setEventImages(current => current.filter(item => !mediaToDelete.includes(item.id)));
        toggleEditMode();
      } else {
        console.error('Failed to delete media item(s)');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }, [eventImages, selectedMedia, toggleEditMode]);


  const navigate = useNavigate();

  const handleImageClick = (image) => {
    setCurrentImage(image);
    setIsModalOpen(true);
  };

  const [userDetails, setUserDetails] = useState({
    name: '',
    user_id: '',
    type: '',
  });




  const showLeaveModal = (eventId) => {
    setPendingLeaveEventId(eventId);
    setIsLeaveModalOpen(true);
  };

  const confirmLeaveEvent = () => {
    if (pendingLeaveEventId) {
      handleLeaveEvent(pendingLeaveEventId);
    }
    setIsLeaveModalOpen(false);
  };

  const handleShowDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    handleDelete(event.id);
    setIsDeleteModalOpen(false);
  };


  const sendConfirmationEmail = async (eventId, userId) => {
    try {
      const response = await fetch('/api/events/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, userId }),
      });

      if (response.ok) {
        console.log('Confirmation email sent successfully');
      } else {
        console.error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  };

  const handleModalSaveChanges = async (updatedImage) => {
    try {
      const response = await fetch(`/api/media/${updatedImage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedImage),
      });

      console.log(response);
      console.log(updatedImage);

      if (response.ok) {
        setEventImages(prevImages =>
          prevImages.map(img =>
            img.id === updatedImage.id ? updatedImage : img
          )
        );
      } else {
        console.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch('/user-details', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        setUserDetails(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  function toggleScrollability(desiredState) {
    const body = document.body;
    if (desiredState) {
      body.classList.remove('body-no-scroll');
    } else {
      body.classList.add('body-no-scroll');
    }
  }

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (response.status === 404) {
          setError('Event not found');
          setLoading(false);
          navigate('/calendar');
          return;
        }
        const data = await response.json();
        console.log(data);
        eventRef.current = data;
        setEvent(data);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    const fetchEventImages = async () => {
      if (activeTab !== "images" || !event?.id) {
        return;
      }

      setImagesLoading(true);
      try {
        const response = await fetch(`/api/media/event/${event.id}`);
        const data = await response.json();
        console.log(data);
        setEventImages(data);
      } catch (error) {
        console.error('Error fetching event images:', error);
        setEventImages([]);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchEventImages();
  }, [activeTab, event?.id]);

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (event) => {
    const currentEvent = eventRef.current;
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('event_id', currentEvent.id);
      formData.append('associated_event_id', currentEvent.id);

      try {
        const response = await fetch('/upload-media', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newMedia = await response.json();
          setEventImages((prev) => [...prev, newMedia]);
        } else {
          console.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    event.target.value = ''; // Clear file input
  };


  const renderImagesTab = () => {
    if (imagesLoading) {
      return <div className="images-loading">Loading images...</div>;
    }

    return (
      <div className="images-tab">
        <div className="image-controls">
          {editMode ? (
            <div className="button-actions">
              <button onClick={handleDeleteMedia} disabled={!Object.values(selectedMedia).some(v => v)} className="button-danger">
                DELETE SELECTED
              </button>
              <button onClick={toggleEditMode} className="button-secondary">CANCEL</button>
            </div>
          ) : (
            <div className="button-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
              />
              <button className="event-ghost-button" onClick={() => fileInputRef.current?.click()}>
                UPLOAD MEDIA
              </button>
              <button className="event-ghost-button" onClick={toggleEditMode}>
                MANAGE MEDIA
              </button>
            </div>
          )}
        </div>
        <div className="image-grid">
          {eventImages.length > 0 ? (
            eventImages.map((image) => (
              <div
                key={image.image_id || image.id}
                className={`image-card ${editMode ? 'edit-mode' : ''}`}
                onClick={(e) => {
                  if (editMode) {
                    e.stopPropagation();
                    handleSelectMedia(image.url);
                  } else {
                    handleImageClick(image);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {editMode && (
                  <div className="select-overlay">
                    {selectedMedia[image.url] ? '✓' : 'O'}
                  </div>
                )}
                {image.media_type === 'video' ? (
                  image.thumbnail_url ? (
                    <img src={image.thumbnail_url} alt={image.name || ''} loading="lazy" />
                  ) : (
                    <video src={image.url} muted playsInline className="media-thumbnail" />
                  )
                ) : (
                  <img src={image.url} alt={image.name || ''} loading="lazy" />
                )}
              </div>
            ))
          ) : (
            <div className="no-images-message">
              No media has been tagged with this event yet.
            </div>
          )}
        </div>

        {currentImage && (
          <ImageModal
            isOpen={isModalOpen}
            closeModal={() => setIsModalOpen(false)}
            currentImage={currentImage}
            onSave={handleModalSaveChanges}
          />
        )}
      </div>
    );
  };

  const handleEdit = () => {
    setIsPanelOpen(true);
    setModalVisible(true);
    toggleScrollability(false);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setModalVisible(false);
    toggleScrollability(true);
  };

  const handleEventUpdate = async (updatedEventData) => {
    try {
      const commonAttributes = {
        date: updatedEventData.event_date && updatedEventData.event_date.trim() !== ""
          ? updatedEventData.event_date
          : event.event_date,
        start_time: updatedEventData.start_time && updatedEventData.start_time.trim() !== ""
          ? `${updatedEventData.start_time}`
          : event.start_time,
        end_time: updatedEventData.end_time && updatedEventData.end_time.trim() !== ""
          ? `${updatedEventData.end_time}`
          : event.end_time,
        title: updatedEventData.title,
        description: updatedEventData.description,
        note: updatedEventData.note,
        color: updatedEventData.color,
        type: updatedEventData.type,
        exclusivity: updatedEventData.exclusivity,
        is_physical: updatedEventData.is_physical,
        location: updatedEventData.is_physical ? updatedEventData.location : null,
        zip_code: updatedEventData.is_physical ? updatedEventData.zip_code : null,
        city: updatedEventData.is_physical ? updatedEventData.city : null,
        state: updatedEventData.is_physical ? updatedEventData.state : null,
        country: updatedEventData.is_physical ? updatedEventData.country : null,
        virtual_link: !updatedEventData.is_physical ? updatedEventData.virtual_link : null,
        cover_image_url: updatedEventData.cover_image_url,
      };

      console.log(commonAttributes);

      const response = await fetch(`/api/events/${updatedEventData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commonAttributes),
      });

      if (response.ok) {
        const updatedEvent = await response.json();

        console.log("UP: " + updatedEvent);
        setEvent(prevEvent => ({
          ...updatedEvent,
          participants: prevEvent.participants
        }));

        setIsPanelOpen(false);
        toggleScrollability(true);
      } else {
        console.error('Failed to update event:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const formatTime = (time) => {
    console.log('formatTime called with:', time);
    if (!time) {
      console.warn('Invalid time value:', time);
      return 'Invalid Time'; // Gracefully handle null/undefined
    }
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const adjustedHour = h % 12 || 12;
    return `${adjustedHour}:${minutes} ${period}`;
  };

  const handleDelete = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        navigate('/calendar');
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setEvent(prevEvent => ({
          ...prevEvent,
          participants: [
            ...prevEvent.participants,
            { user_id: userDetails.user_id, name: userDetails.name }
          ]
        }));
        setIsJoinedModalOpen(true);
      } else {
        throw new Error('Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const handleLeaveEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}/leave`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setEvent(prevEvent => ({
          ...prevEvent,
          participants: prevEvent.participants.filter(
            participant => participant.user_id !== userDetails.user_id
          )
        }));
        setIsLeaveModalOpen(false);
      } else {
        throw new Error('Failed to leave event');
      }
    } catch (error) {
      console.error('Error leave event:', error);
    }
  };

  const renderModal = () => {
    if (!isPanelOpen || !modalVisible) return null;

    return createPortal(
      <div className="modal-overlay" onClick={handleClosePanel}>
        <div className="event-modal-wrapper" onClick={e => e.stopPropagation()}>
          <EventModal
            eventData={event}
            onClose={handleClosePanel}
            mode="edit"
            onEventUpdate={handleEventUpdate}
            userDetails={userDetails}
            handleJoinEvent={() => handleJoinEvent(event.id)}
            handleLeaveEvent={() => handleLeaveEvent(event.id)}
            handleDelete={handleDelete}
          />
        </div>
      </div>,
      document.body
    );
  };

  if (loading || !event) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="event-page">
      <header className="top-bar-home">
        <Steamed />
        <h1>OWL<sup>2</sup> Club</h1>
      </header>

      {/* Banner Image */}
      <div className="banner" style={{ backgroundImage: `url(${event.cover_image_url || event.bannerImage || bannerImage})` }}>
        <div className="banner-overlay"></div>
      </div>

      {/* Title and Edit Button */}
      <div className="event-title-container">
        <h1 className="event-title">{event.title}</h1>
      </div>

      {isEmailModalOpen && (
        <EventMailer
          event={event}
          onClose={() => setIsEmailModalOpen(false)}
        />
      )}

      {renderModal()}

      {/* Tabs Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("details")} className={activeTab === "details" ? "active" : ""}>Details</button>
        <button onClick={() => setActiveTab("participation")} className={activeTab === "participation" ? "active" : ""}>Participation</button>
        <button onClick={() => setActiveTab("images")} className={activeTab === "images" ? "active" : ""}>Media</button>
        <button onClick={() => setActiveTab("comments")} className={activeTab === "comments" ? "active" : ""}>Comments</button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "details" && (
          <div className="details-tab">
            <p><strong>Date:</strong>{formatDateRead(event.event_date.split('T')[0])}</p>
            <p>
              <strong>Time:</strong>{formatTime(event.start_time)} - {formatTime(event.end_time)}
            </p>
            <p>
              <strong>Type:</strong>{event.is_physical ? 'Physical' : 'Virtual'}
            </p>
            <p>
              <strong>Location:</strong>{event.is_physical ? (
                <>
                  {event.location && <span>{event.location}, </span>}
                  {event.city && <span>{event.city}, </span>}
                  {event.state && <span>{event.state}, </span>}
                  {event.zip_code && <span>{event.zip_code}, </span>}
                  {event.country && <span>{event.country}</span>}
                </>
              ) : (
                <a href={event.virtual_link} target="_blank" rel="noopener noreferrer">
                  {event.virtual_link || 'No link provided'}
                </a>
              )}
            </p>
            <p><strong>Category:</strong>{EVENT_TYPE_MAP[event.type] || event.type || "Unknown"}</p>
            <p><strong>Exclusivity:</strong>{event.exclusivity === 'invite-only' ? 'Invitation Only' : event.exclusivity}</p>
            <p><strong>Description:</strong>{event.description}</p>
            <div className="details-actions">
              <button className="event-ghost-button" onClick={handleEdit}>EDIT DETAILS</button>
              <button className="event-ghost-button" onClick={handleShowDeleteModal}>DELETE EVENT</button>
              <button className="event-ghost-button" onClick={() => setIsEmailModalOpen(true)}>DRAFT ANNOUNCEMENT EMAIL</button>
            </div>

            <DeleteConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={handleCloseDeleteModal}
              onConfirm={handleConfirmDelete}
              eventName={event.title}
            />
            {event.participants && event.participants.length > 0 && (
              <div>
                <h4>Participants</h4>
                <ul>
                  {event.participants.map(participant => (
                    <li key={participant.user_id}>{participant.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="comments-tab">
            <Comments commentableId={event.id} />
          </div>
        )}

        {activeTab === "participation" && (
          <div className="participation-tab">
            <div className="participants-section">
              <h4>Current Participants ({event.participants?.length || 0})</h4>

              {/* Participants list */}
              {event.participants && event.participants.length > 0 ? (
                <ul className="participants-list">
                  {event.participants.map(participant => (
                    <li key={participant.user_id} className="participant-item">
                      <span className="participant-name">{participant.name}</span>
                      {participant.user_id === userDetails.user_id && (
                        <span className="current-user-badge">(You)</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-participants">No participants yet. Be the first to join!</p>
              )}

              {/* Join/Leave button */}
              <div className="participation-actions">
                {event.participants?.some(p => p.user_id === userDetails.user_id) ? (
                  <button
                    onClick={() => showLeaveModal(event.id)}
                    className="event-ghost-button"
                  >
                    LEAVE EVENT
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinEvent(event.id)}
                    className="event-ghost-button"
                  >
                    JOIN EVENT
                  </button>
                )}
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="event-ghost-button"
                >
                  INVITE MEMBER(S)
                </button>
              </div>
            </div>

            <InviteModal
              isOpen={isInviteModalOpen}
              onClose={() => setIsInviteModalOpen(false)}
              eventId={event.id}
              eventTitle={event.title}
            />

            <JoinedModal
              isOpen={isJoinedModalOpen}
              onClose={() => setIsJoinedModalOpen(false)}
              eventName={event.title}
              onSendConfirmation={() => sendConfirmationEmail(event.id, userDetails.user_id)}
            />

            <LeaveConfirmationModal
              isOpen={isLeaveModalOpen}
              onClose={() => setIsLeaveModalOpen(false)}
              onConfirm={() => handleLeaveEvent(event.id)}
            />
          </div>
        )}

        {activeTab === "images" && renderImagesTab()}
      </div>
    </div>
  );
};

export default EventPage;
