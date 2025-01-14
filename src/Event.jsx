import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Event.css'
import Steamed from './Steamed.jsx';
import { createPortal } from 'react-dom';
import bannerImage from './assets/banner1.jpeg';
import EventsFourTabbedModal from './EventsFourTabbedModal.jsx';
import ImageModal from './ImageModal.jsx';

const InviteModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        console.log(data)

        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = user.name ? user.name.toLowerCase().includes(searchLower) : false;
    const emailMatch = user.email.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  const handleSendInvites = async () => {
    setLoading(true);
    try {
      console.log('Sending invites for users:', selectedUsers); 
      const response = await fetch('/api/events/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: Number(eventId), 
          eventTitle,
          userIds: selectedUsers.map(id => Number(id)) 
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to send invites');
      }
  
      const data = await response.json();
      console.log('Invite response:', data); 
      onClose();
    } catch (error) {
      console.error('Error sending invites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-container">
      <div className="backdrop" onClick={onClose} />
      <div className="modal invite-modal">
        <div className="modal-header">
          <h2>Invite Members</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="users-list">
            {filteredUsers.map(user => (
              <div key={user.user_id} className="user-item">
                <label className="user-label">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.user_id)}
                    onChange={() => handleUserSelect(user.user_id)}
                  />
                  <span className="user-info">
                  <span className="user-name">{user.name || user.email}</span>
                  <span className="user-email">({user.email})</span>
                    <span className="user-type">{user.type}</span>
                  </span>
                </label>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button
              className="invite-button"
              onClick={handleSendInvites}
              disabled={loading || selectedUsers.length === 0}
            >
              {loading ? 'Sending Invites...' : `Invite Selected (${selectedUsers.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
  const navigate = useNavigate();

  const handleImageClick = (image) => {
    console.log('Selected image:', image);
    setCurrentImage(image);
    setIsModalOpen(true);
  };

  const [userDetails, setUserDetails] = useState({
    name: '',
    user_id: '',
    type: '',
  });

  const handleAddComment = async (commentText) => {
    if (!currentImage) return;
  
    try {
      const response = await fetch(`/api/images/${currentImage.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: commentText }),
      });
  
      if (response.ok) {
        const newComment = await response.json();
        setCurrentImage(prev => ({
          ...prev,
          comments: [...(prev?.comments || []), newComment]
        }));
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSaveChanges = async (editFields) => {
    if (!currentImage || !currentImage.image_id) return; // Check for image_id specifically
  
    const updatedImage = {
      ...currentImage,
      name: editFields.name,
      description: editFields.description,
      tags: editFields.tags
    };
  
    try {
      const response = await fetch(`/api/images/${currentImage.image_id}`, { // Use image_id
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFields.name,
          description: editFields.description,
          tags: editFields.tags
        }), // Only send the fields the server expects
      });
  
      if (response.ok) {
        const updatedImageData = await response.json();
        
        // Update eventImages state with the new data
        setEventImages(prevImages => 
          prevImages.map(img => 
            img.image_id === currentImage.image_id ? updatedImageData : img
          )
        );
        
        // Update the currentImage state to reflect changes
        setCurrentImage(updatedImageData);
        
        // Close the modal
        setIsModalOpen(false);
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
      if (!activeTab === "images" || !event?.title) {
        return;
      }
  
      setImagesLoading(true);
      try {
        const response = await fetch('/api/images/' + event.title);
        const data = await response.json();
        setEventImages(data);
      } catch (error) {
        console.error('Error:', error);
        setEventImages([]);
      }
      setImagesLoading(false);
    };
  
    fetchEventImages();
  }, [activeTab, event?.title]);

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
                onClick={() => handleImageClick(image)} // Add this click handler
                style={{ cursor: 'pointer' }} // Optional: add pointer cursor
              >
                <img 
                  src={image.url} 
                  alt={image.name || 'Event image'} 
                />
                {image.name && (
                  <div className="image-caption">
                    {image.name}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-images-message">
              No images have been tagged with this event yet.
            </div>
          )}
        </div>
  
        {/* Add ImageModal here, inside the images tab */}
        {currentImage && (
          <ImageModal
            isOpen={isModalOpen}
            closeModal={() => setIsModalOpen(false)}
            currentImage={currentImage}
            onSaveChanges={handleSaveChanges}
            onAddComment={handleAddComment}
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
            date: updatedEventData.event_date,
            start_time: updatedEventData.start_time + ":00",
            end_time: updatedEventData.end_time + ":00",
            title: updatedEventData.title,
            description: updatedEventData.description,
            note: updatedEventData.note,
            color: updatedEventData.color,
            location: updatedEventData.location,
            type: updatedEventData.type,
            exclusivity: updatedEventData.exclusivity,
          };
      
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
          <button className="edit-button" onClick={handleEdit}>Edit</button>
        </div>

      {renderModal()}

      {/* Tabs Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab("details")} className={activeTab === "details" ? "active" : ""}>Details</button>
        <button onClick={() => setActiveTab("comments")} className={activeTab === "comments" ? "active" : ""}>Notes</button>
        <button onClick={() => setActiveTab("participation")} className={activeTab === "participation" ? "active" : ""}>Participation</button>
        <button onClick={() => setActiveTab("images")} className={activeTab === "images" ? "active" : ""}>Images</button>
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
            <textarea className="comments-input" placeholder="Write a comment..." />
            {/* Render any existing notes/comments here */}
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
                      onClick={() => handleLeaveEvent(event.id)}
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
            </div>
          )}

        {activeTab === "images" && renderImagesTab()} 
      </div>
    </div>
  );
};

export default EventPage;
