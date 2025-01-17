import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Event.css'
import Steamed from './Steamed.jsx';
import bannerImage from './assets/banner1.jpeg';
import EventsFourTabbedModal from './EventsFourTabbedModal.jsx';
import ImageModal from './ImageModal.jsx';
import InviteModal from './InviteModal.jsx';
import Comments from './Comments.jsx';
import { createPortal } from 'react-dom';

const JoinedModal = ({ isOpen, onClose, eventName, onSendConfirmation }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <h2>Welcome to {eventName}!</h2>
        <p>You have successfully joined the event.</p>
        <button onClick={onSendConfirmation}>Send Confirmation Email</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const LeaveConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <h3>Are you sure you want to leave?</h3>
        <button onClick={onConfirm}>Yes, Leave</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
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
  const [pendingLeaveEventId, setPendingLeaveEventId] = useState(null);

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
      const response = await fetch(`/api/images/${updatedImage.id}`, {
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
    if ( desiredState ) {
        body.classList.remove('body-no-scroll');
    } else  {
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
        const response = await fetch(`/api/images/event/${event.id}`); 
        const data = await response.json();
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

  const renderImagesTab = () => {
    if (imagesLoading) {
      return <div className="images-loading">Loading images...</div>;
    }
  
    return (
      <div className="images-tab">
        <div className="image-grid">
          {eventImages.length > 0 ? (
            eventImages.map((image) => (
              <div 
                key={image.image_id} 
                className="image-card"
                onClick={() => handleImageClick(image)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={image.url} 
                />
                {/*image.name && (
                  <div className="image-caption">
                    {image.name}
                  </div>
                )*/}
              </div>
            ))
          ) : (
            <div className="no-images-message">
              No images have been tagged with this event yet.
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
                ? `${updatedEventData.start_time}:00` 
                : event.start_time, 
            end_time: updatedEventData.end_time && updatedEventData.end_time.trim() !== "" 
                ? `${updatedEventData.end_time}:00` 
                : event.end_time, 
                
            title: updatedEventData.title,
            description: updatedEventData.description,
            note: updatedEventData.note,
            color: updatedEventData.color,
            location: updatedEventData.location,
            type: updatedEventData.type,
            exclusivity: updatedEventData.exclusivity,
          };

          console.log(updatedEventData);
      
          const response = await fetch(`/api/events/${updatedEventData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(commonAttributes),
          });
      
          if (response.ok) {
            const responseData = await response.json();
      
            const startDateTime = new Date(`${updatedEventData.event_date}T${updatedEventData.start_time}`);
            const endDateTime = new Date(`${updatedEventData.event_date}T${updatedEventData.end_time}`);
      
            setEvent({
              ...commonAttributes,
              id: updatedEventData.id,
              startDateTime,
              endDateTime,
              participants: updatedEventData.participants || [],
              temp: false,
            });
      
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
          <div className="modal-container">
            <div 
              className="backdrop" 
              onClick={handleClosePanel}
              style={{ display: modalVisible ? 'block' : 'none' }}
            />
            <div className="modal" style={{ display: modalVisible ? 'block' : 'none' }}>
              <EventsFourTabbedModal
                eventData={event}
                onClose={handleClosePanel}
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

    return (
      <div className="event-page">
        <Steamed />

        {/* Banner Image */}
        <div className="banner" style={{ backgroundImage: `url(${event.bannerImage || bannerImage})` }}>
          <div className="banner-overlay"></div>
        </div>

        {/* Title and Edit Button */}
        <div className="event-title-container">
          <h1 className="event-title">{event.title}</h1>
        </div>

      {renderModal()}

      {/* Tabs Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("details")} className={activeTab === "details" ? "active" : ""}>Details</button>
        <button onClick={() => setActiveTab("participation")} className={activeTab === "participation" ? "active" : ""}>Participation</button>
        <button onClick={() => setActiveTab("images")} className={activeTab === "images" ? "active" : ""}>Images</button>
        <button onClick={() => setActiveTab("comments")} className={activeTab === "comments" ? "active" : ""}>Notes and Comments</button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "details" && (
          <div className="details-tab">
            <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {event.start_time} - {event.end_time}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Type:</strong> {event.type}</p>
            <p><strong>Exclusivity:</strong> {event.exclusivity}</p>
            <p><strong>Description:</strong> {event.description}</p>
            <button className="edit-button" onClick={handleEdit}>Edit Details</button>
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
            <h4>Notes and Comments</h4>
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
                      className="leave-button"
                    >
                      Leave Event
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleJoinEvent(event.id)}
                      className="join-button"
                    >
                      Join Event
                    </button>
                  )}
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="invite-button"
                  >
                    Invite Member(s)
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
