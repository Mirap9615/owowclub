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

const LinkifyText = ({ text }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#725d29', textDecoration: 'underline' }}>
          {part}
        </a>
      );
    }
    return part;
  });
};

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

const formatDateRead = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return 'N/A';
  const d = new Date(`${utcDate.split('T')[0]}T${utcTime}Z`);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatTimeFromUTC = (utcDate, utcTime) => {
  if (!utcDate || !utcTime) return 'Invalid Time';
  const d = new Date(`${utcDate.split('T')[0]}T${utcTime}Z`);
  if (isNaN(d.getTime())) return 'Invalid Time';
  let h = d.getHours();
  let m = d.getMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
};

const EventPage = () => {
  const { id, tab } = useParams();
  const navigate = useNavigate();
  // Map URL tab names to internal state names
  const getTabFromUrl = (urlTab, isPast) => {
    if (urlTab === 'media') return 'images';
    if (['details', 'participation', 'comments', 'summary'].includes(urlTab)) return urlTab;
    return isPast ? 'summary' : 'details';
  };

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // Set initial state appropriately later
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
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


  const handleImageClick = (image) => {
    // Ensure the image has the associated_event_id set to the current event
    // This is crucial because the API might not return it when fetching images FOR an event
    const imageWithContext = {
      ...image,
      associated_event_id: image.associated_event_id || event.id
    };
    setCurrentImage(imageWithContext);
    setIsModalOpen(true);
  };

  const [userDetails, setUserDetails] = useState({
    name: '',
    user_id: '',
    type: '',
    admin: false,
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
        // Sync currentImage if it's the item being updated
        if (currentImage && currentImage.id === updatedImage.id) {
          setCurrentImage(updatedImage);
        }
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

  // Redirect to /details or /summary if no tab is specified
  useEffect(() => {
    if (!tab && event) {
      const isPast = new Date() > new Date(`${event.event_date.split('T')[0]}T${event.end_time}Z`);
      navigate(`/events/${id}/${isPast ? 'summary' : 'details'}`, { replace: true });
    }
  }, [id, tab, navigate, event]);

  // Sync activeTab with URL changes
  useEffect(() => {
    const isPast = event ? new Date() > new Date(`${event.event_date.split('T')[0]}T${event.end_time}Z`) : false;
    setActiveTab(getTabFromUrl(tab, isPast));
  }, [tab, event]);

  const handleTabChange = (newTab) => {
    const urlTab = newTab === 'images' ? 'media' : newTab;
    navigate(`/events/${id}/${urlTab}`);
  };

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
          {userDetails.user_id && (
            editMode ? (
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
            )
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
            userDetails={userDetails}
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
      const getLocalFormattedDate = (utcDate, utcTime) => {
          if (!utcDate || !utcTime) return '';
          const d = new Date(`${utcDate.split('T')[0]}T${utcTime}Z`);
          if (isNaN(d.getTime())) return '';
          return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      };
      const getLocalFormattedTime = (utcDate, utcTime) => {
          if (!utcDate || !utcTime) return '';
          const d = new Date(`${utcDate.split('T')[0]}T${utcTime}Z`);
          if (isNaN(d.getTime())) return '';
          return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      };

      const rawDate = updatedEventData.event_date && updatedEventData.event_date.trim() !== ""
          ? updatedEventData.event_date
          : getLocalFormattedDate(event.event_date, event.start_time);
      const rawStart = updatedEventData.start_time && updatedEventData.start_time.trim() !== ""
          ? updatedEventData.start_time
          : getLocalFormattedTime(event.event_date, event.start_time);
      const rawEnd = updatedEventData.end_time && updatedEventData.end_time.trim() !== ""
          ? updatedEventData.end_time
          : getLocalFormattedTime(event.event_date, event.end_time);

      const startObj = new Date(`${rawDate}T${rawStart}`);
      const endObj = new Date(`${rawDate}T${rawEnd}`);

      const commonAttributes = {
        date: startObj.toISOString().split("T")[0],
        start_time: startObj.toISOString().split("T")[1].substring(0, 5),
        end_time: endObj.toISOString().split("T")[1].substring(0, 5),
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

  const handleDelete = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        navigate('/events');
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

  const isPastEvent = new Date() > new Date(`${event.event_date.split('T')[0]}T${event.end_time}Z`);

  const handleSaveSummary = async (newSummary) => {
    try {
      const updatedData = {
        ...event,
        date: event.event_date.split('T')[0],
        summary: newSummary
      };

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvent(prev => ({ ...prev, summary: updatedEvent.summary || newSummary }));
        setIsEditingSummary(false);
      } else {
        console.error('Failed to save summary:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  const handleAddToGoogleCalendar = () => {
    const startObj = new Date(`${event.event_date.split('T')[0]}T${event.start_time}Z`);
    const endObj = new Date(`${event.event_date.split('T')[0]}T${event.end_time}Z`);
    
    const formatICSDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const locationStr = event.is_physical ? 
        [event.location, event.city, event.state, event.country].filter(Boolean).join(', ') : 
        event.virtual_link;

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title || 'OWL^2 Event')}&dates=${formatICSDate(startObj)}/${formatICSDate(endObj)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(locationStr || '')}`;
    
    window.open(googleCalUrl, '_blank');
  };

  const handleDownloadICS = () => {
    const startObj = new Date(`${event.event_date.split('T')[0]}T${event.start_time}Z`);
    const endObj = new Date(`${event.event_date.split('T')[0]}T${event.end_time}Z`);
    const formatICSDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const locationStr = event.is_physical ? 
        [event.location, event.city, event.state, event.country].filter(Boolean).join(', ') : 
        event.virtual_link;

    const icsString = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//OWOW Club//Events//EN\r\nBEGIN:VEVENT\r\nUID:${event.id}@owowclub.com\r\nDTSTAMP:${formatICSDate(new Date())}\r\nDTSTART:${formatICSDate(startObj)}\r\nDTEND:${formatICSDate(endObj)}\r\nSUMMARY:${event.title || 'OWL^2 Event'}\r\nDESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}\r\nLOCATION:${locationStr || ''}\r\nEND:VEVENT\r\nEND:VCALENDAR`;

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${event.slug || 'event'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        {isPastEvent && (
          <button onClick={() => handleTabChange("summary")} className={activeTab === "summary" ? "active" : ""}>Summary</button>
        )}
        <button onClick={() => handleTabChange("details")} className={activeTab === "details" ? "active" : ""}>Details</button>
        <button onClick={() => handleTabChange("participation")} className={activeTab === "participation" ? "active" : ""}>Participation</button>
        <button onClick={() => handleTabChange("images")} className={activeTab === "images" ? "active" : ""}>Media</button>
        <button onClick={() => handleTabChange("comments")} className={activeTab === "comments" ? "active" : ""}>Comments</button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "summary" && isPastEvent && (
          <div className="summary-tab">
            <div className="summary-status-banner">
              <h2>This event has concluded.</h2>
              <p>Thank you to everyone who participated!</p>
            </div>

            <div className="summary-blog-section">
              <h3>Event Summary</h3>
              {isEditingSummary ? (
                <div className="summary-edit-container">
                  <textarea
                    className="summary-textarea"
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    placeholder="Write a summary about this event..."
                  />
                  <div className="summary-edit-actions">
                    <button className="event-ghost-button" onClick={() => handleSaveSummary(summaryDraft)}>Save Summary</button>
                    <button className="event-ghost-button" onClick={() => setIsEditingSummary(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="summary-content">
                  <p><LinkifyText text={event.summary || "This event was a wonderful gathering filled with exciting moments. Check out the media gallery to see highlights from the occasion!"} /></p>
                  {(userDetails.admin || userDetails.type?.trim().toLowerCase() === 'founding') && (
                    <button
                      className="event-ghost-button edit-summary-btn"
                      onClick={() => {
                        setSummaryDraft(event.summary || '');
                        setIsEditingSummary(true);
                      }}
                    >
                      EDIT SUMMARY
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="summary-media-preview">
              <h3>Gallery Highlights</h3>
              <p className="summary-gallery-hint">Venture over to the <a href={`/events/${event.slug}/media`} onClick={(e) => { e.preventDefault(); handleTabChange("images"); }}>Media</a> tab to view all photos and videos!</p>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="details-tab">
            <p><strong>Date:</strong>{formatDateRead(event.event_date, event.start_time)}</p>
            <p>
              <strong>Time:</strong>{formatTimeFromUTC(event.event_date, event.start_time)} - {formatTimeFromUTC(event.event_date, event.end_time)}
            </p>
            <p>
              <strong>Type:</strong>{event.is_physical ? 'Physical' : 'Virtual'}
            </p>
            <p>
              <strong>Location:</strong>{event.is_physical ? (
                userDetails.user_id ? (
                  <>
                    {event.location && <span>{event.location}, </span>}
                    {event.city && <span>{event.city}, </span>}
                    {event.state && <span>{event.state}, </span>}
                    {event.zip_code && <span>{event.zip_code}, </span>}
                    {event.country && <span>{event.country}</span>}
                  </>
                ) : (
                  <>
                    {event.city && <span>{event.city}, </span>}
                    {event.state && <span>{event.state}, </span>}
                    {event.country && <span>{event.country}</span>}
                  </>
                )
              ) : (
                userDetails.user_id ? (
                  <a href={event.virtual_link} target="_blank" rel="noopener noreferrer">
                    {event.virtual_link || 'No link provided'}
                  </a>
                ) : (
                  <span>Login to view link</span>
                )
              )}
            </p>
            <p><strong>Category:</strong>{EVENT_TYPE_MAP[event.type] || event.type || "Unknown"}</p>
            <p><strong>Exclusivity:</strong>{event.exclusivity === 'invite-only' ? 'Invitation Only' : event.exclusivity}</p>
            <p><strong>Description:</strong> <LinkifyText text={event.description} /></p>

            {!userDetails.user_id && (
              <p style={{ color: '#888', marginTop: '20px' }}>
                Log in to see full event details
              </p>
            )}

            <div className="details-actions">
              <button className="event-ghost-button" onClick={handleAddToGoogleCalendar}>ADD TO GOOGLE CALENDAR</button>
              <button className="event-ghost-button" onClick={handleDownloadICS}>ADD TO APPLE CALENDAR</button>

              {(userDetails.admin || userDetails.type?.trim().toLowerCase() === 'founding') && (
                <>
                  <button className="event-ghost-button" onClick={handleEdit}>EDIT DETAILS</button>
                  <button className="event-ghost-button" onClick={handleShowDeleteModal}>DELETE EVENT</button>
                  <button className="event-ghost-button" onClick={() => setIsEmailModalOpen(true)}>DRAFT ANNOUNCEMENT EMAIL</button>
                </>
              )}
            </div>

            <DeleteConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={handleCloseDeleteModal}
              onConfirm={handleConfirmDelete}
              eventName={event.title}
            />
            {userDetails.user_id && event.participants && event.participants.length > 0 && (
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
            {userDetails.user_id ? (
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
            ) : (
              <div className="login-prompt">
                <p>Please log in to view participants and join the event.</p>
              </div>
            )}

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
