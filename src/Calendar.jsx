import React, { useState, useEffect, useRef } from 'react';
import Steamed from './Steamed.jsx';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Cal.css';
import checkAuth from './CheckAuth.jsx';
import { HexColorPicker } from 'react-colorful';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import EventsThreeTabbedModal from './EventsThreeTabbedModal.jsx';
import EventsFourTabbedModal from './EventsFourTabbedModal.jsx';


const EventDetailsPanel = ({ event, onClose, onTriggerEdit, onColorChange, setEvents, fetchEvents, toggleScrollability, userDetails}) => {
    if (event == null) { return };
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(() => event || {});

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalColor, setOriginalColor] = useState(null);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
    const toggleColorPicker = () => {
        if (isEditMode) {  
            setIsColorPickerVisible(prev => !prev);
        }
    };
    const startTimeRef = useRef(event.startDateTime);
    const endTimeRef = useRef(event.endDateTime);
    const titleRef = useRef(event.title);
    const descRef = useRef(event.description);
    const noteRef = useRef(event.note);

    useEffect(() => {
        if (onTriggerEdit) {
            onTriggerEdit(setIsEditMode);
        }
    }, [onTriggerEdit]);

    useEffect(() => {
      const checkLoginStatus = async () => {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          navigate('/no-permission');
        }
      };
      checkLoginStatus();
    }, [navigate]);

    useEffect(() => {
      if (event && event.id !== eventData.id) {
          setEventData(event);
      }
    }, [event]);
    
    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        if (!isEditMode) {
            setOriginalColor(event.color);
        } else {
            handleColorRevert(); 
        }
    };

    const handleChange = (key, value) => {
        setEventData(prev => ({ ...prev, [key]: value }));
    };

    const handleDeleteInitiate = () => {
        setShowConfirmModal(true);
    };

    const handleDeleteConfirm = () => {
        handleDelete(event.id);
        setShowConfirmModal(false);
        onClose();
    };

    const handleCloseModal = () => {
        setShowConfirmModal(false);
    };

    const handleDelete = async (eventId) => {
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete event');
            }
    
            setEvents(currentEvents => currentEvents.filter(event => event.id !== eventId));
            setEventData(null);
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const handleSave = async () => {
        const eventToSave = {
            start_time: new Date(startTimeRef.current.textContent).toISOString(),
            end_time: new Date(endTimeRef.current.textContent).toISOString(),
            title: titleRef.current.textContent,
            description: descRef.current.textContent,
            note: noteRef.current.textContent,
            color: event.color
        };

        const isNew = typeof eventData.id === 'string' && eventData.id.includes('-');
        const url = `/api/events${isNew ? '' : '/' + eventData.id}`;
        const method = isNew ? 'POST' : 'PUT';
    
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventToSave)
            });
    
            if (!response.ok) {
                throw new Error('Failed to save event');
            }
    
            const data = await response.json();

            setEvents(currentEvents => currentEvents.map(event => 
                event.id === eventData.id ? {...eventData, id: data.id} : event
            ));

            await fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
        }
        setIsEditMode(false);
        toggleScrollability(true);
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
          const updatedParticipants = [...eventData.participants, { user_id: userDetails.user_id, name: userDetails.name }];
          setEventData((prevData) => ({
          ...prevData,
          participants: updatedParticipants,
          }));
          fetchEvents(); 
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
          const updatedParticipants = eventData.participants.filter((participant) => participant.user_id !== userDetails.user_id);
          setEventData((prevData) => ({
            ...prevData,
            participants: updatedParticipants,
          }));
          fetchEvents(); 
        } else {
          throw new Error('Failed to leave event');
        }
      } catch (error) {
        console.error('Error leave event:', error);
      }
    };

    if (!event) return null;

    return (
        <div className="side-panel"> 
            
            <div
                className="card-title"
                contentEditable={isEditMode}
                ref={titleRef}
                suppressContentEditableWarning={true} 
                style={{minWidth: 'fit-content'}}
            >
                {eventData.title}
            </div>

            <div className="card-datg">
                <div
                    className="card-date"
                    contentEditable={isEditMode}
                    ref={startTimeRef}
                    suppressContentEditableWarning={true}
                >
                    {format(new Date(eventData.startDateTime), 'MM/dd/yyyy HH:mm')}
                </div>
                <span className="card-date-span">to</span>
                <div
                    className="card-date"
                    contentEditable={isEditMode}
                    ref={endTimeRef}
                    suppressContentEditableWarning={true}
                >
                    {format(new Date(eventData.endDateTime), 'MM/dd/yyyy HH:mm')}
                </div>
            </div>

            <div className="desc-lead">Description</div>
                <div
                    className="card-desc"
                    contentEditable={isEditMode}
                    ref={descRef}
                    suppressContentEditableWarning={true}
                >
                    {eventData.description}
            </div>

            <div className="card-part">Participating Members</div>
            <div>
                {eventData.participants.length > 0 
              ? eventData.participants.map((participant) => participant.name).join(', ') 
              : 'No participants yet'}
            </div>
            <button 
              className="card-join"
              onClick={() => {
                if (eventData.participants.some(participant => participant.user_id === userDetails.user_id)) {
                  handleLeaveEvent(eventData.id); 
                } else {
                  handleJoinEvent(eventData.id); 
                }
              }}
            >
              {eventData.participants.some(participant => participant.user_id === userDetails.user_id) ? 'Leave' : 'Join'}
            </button>

            <div className="note-lead">Notes</div>
                <div
                    className="card-note"
                    contentEditable={isEditMode}
                    ref={noteRef}
                    suppressContentEditableWarning={true}
                >
                    {eventData.note}
            </div>

            {isEditMode && (
                <div className="color-picker-container">
                    <button className="card-ccol" onClick={toggleColorPicker}>
                        Change Color
                    </button>

                    {isColorPickerVisible && (
                        <HexColorPicker
                            color={eventData.color}
                            onChange={(color) => onColorChange(color, eventData.id)}
                        />
                    )}
                </div>
            )}

            <div className="edit-n-close">
            {userDetails.type !== 'Standard' && (
              <>
                <button className="card-edit" onClick={isEditMode ? handleSave : toggleEditMode}>
                    {isEditMode ? "Save" : "Edit"}
                </button>
                <button className="card-delete" onClick={handleDeleteInitiate} style={{ visibility: isEditMode ? 'visible' : 'hidden' }}>Delete</button>
              </>
              )}
                <button className="card-close" onClick={onClose}>Close</button>
            </div>

            {showConfirmModal && (
                <ConfirmModal 
                    isOpen={showConfirmModal} 
                    onClose={handleCloseModal} 
                    onConfirm={handleDeleteConfirm}
                />
            )}
        </div>
    );
};

function ConfirmModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Confirm Delete</h2>
                <p>Are you sure you want to delete this event?</p>
                <button onClick={onConfirm}>Confirm</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
}

const findEventsForDate = (selectedDate, allEvents) => {
    return allEvents.filter(event => {
      const startDate = new Date(event.startDateTime);
      const endDate = new Date(event.endDateTime);
      
      startDate.setHours(0, 0, 0, 0); 
      endDate.setHours(23, 59, 59, 999); 
  
      const checkDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

function Cal() {
  const [value, onChange] = useState(new Date());
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    const Url = '/api/events';

      try {
        let response = await fetch(Url);
        if (response.ok) {
            const data = await response.json();
            console.log(data);
            const parsedEvents = data.map(event => {
                // Combine event_date and start_time to form startDateTime
                const eventDate = event.event_date.split('T')[0];
                const startDateTime = new Date(`${eventDate}T${event.start_time}`);
                const endDateTime = new Date(`${eventDate}T${event.end_time}`);

                return {
                    id: event.id,
                    startDateTime: startDateTime,
                    endDateTime: endDateTime,
                    title: event.title,
                    description: event.description,
                    note: event.note,
                    color: event.color,
                    location: event.location,
                    type: event.type,
                    exclusivity: event.exclusivity,
                    participants: event.participants || []
                };
            });
            setEvents(parsedEvents);
          } else {
              throw new Error('Failed to fetch events');
          }
      } catch (error) {
          console.error('Error fetching events:', error);
      }
    };


    function toggleScrollability(desiredState) {
        const body = document.body;
        if ( desiredState ) {
            body.classList.remove('body-no-scroll');
        } else  {
            body.classList.add('body-no-scroll');
        }
    }

  useEffect(() => {
        fetchEvents();
    }, []);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const triggerEditMode = (setEditMode) => {
    setEditMode(true);
  };

  const handleEventSelect = (event) => {
    toggleScrollability(false);
    setSelectedEvent(event);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);

    if (selectedEvent && selectedEvent.temp) {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== selectedEvent.id));
    }

    setSelectedEvent(null); 
    toggleScrollability(true);
    };


  useEffect(() => {
    if (selectedEvent) {
      const currentEvent = events.find(event => event.id === selectedEvent.id);
      setSelectedEvent(currentEvent);
    }
  }, [events]);

  const handleCreateEvent = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
};

const handleEventCreate = async (formData) => {
  const finalFormData = {
    title: formData.title.trim() || 'New Event',
    type: formData.type || 'entertainment',
    exclusivity: formData.exclusivity || 'open',
    description: formData.description.trim() || 'default description',
    event_date: formData.date || new Date().toISOString().split("T")[0],
    start_time: formData.startTime || '16:00', 
    end_time: formData.endTime || '21:00',
    location: formData.location.trim() || 'unset',
    color: formData.color || '#d3d3d3',
  };

  try {
      const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalFormData),
      });

      if (response.ok) {
          const responseData = await response.json();

          const startDateTime = new Date(`${finalFormData.event_date}T${finalFormData.start_time}`);
          const endDateTime = new Date(`${finalFormData.event_date}T${finalFormData.end_time}`);

          const createdEvent = {
              id: responseData.id, 
              startDateTime: startDateTime,
              endDateTime: endDateTime,
              title: finalFormData.title,
              description: finalFormData.description,
              note: finalFormData.note || '',
              color: finalFormData.color,
              location: finalFormData.location,
              type: finalFormData.type,
              exclusivity: finalFormData.exclusivity,
              participants: formData.guests || [],
              temp: false,
          };

          setEvents(prevEvents => [...prevEvents, createdEvent]);
      } else {
          console.error('Failed to create event:', response.statusText);
      }
  } catch (error) {
      console.error('Error creating event:', error);
  }

  handleCloseModal();
};

  useEffect(() => {
    if (isPanelOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [isPanelOpen]);

  // Sorting and Searching
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [displayedEvents, setDisplayedEvents] = useState([]);

  useEffect(() => {
    const sortedEvents = [...events].sort((a, b) => {
        if (sortDirection === 'asc') {
            return a.startDateTime - b.startDateTime;
        } else {
            return b.startDateTime - a.startDateTime;
        }
      });

      const filteredEvents = sortedEvents.filter(event => 
          event.title.toLowerCase().includes(filter.toLowerCase())
      );

      setDisplayedEvents(filteredEvents);
  }, [sortDirection, filter, events]);
  
  const toggleSortDirection = () => {
    setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleSearchChange = (e) => {
    setFilter(e.target.value);
  };

  const handleColorChange = (given_color, eventId) => {
    setEvents(prevEvents => prevEvents.map(event =>
        event.id === eventId ? { ...event, color: given_color } : event
    ));
};

  useEffect(() => {
    const originalDisplay = document.body.style.display;
    document.body.style.display = 'block';
    toggleScrollability(true);
    return () => {
      document.body.style.display = originalDisplay;
      toggleScrollability(true);
    };
  }, []);

  const [userDetails, setUserDetails] = useState({
    name: '',
    type: '',
  });

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

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = events.filter(event => {
        const startDate = new Date(event.startDateTime);
        const endDate = new Date(event.endDateTime);
        endDate.setHours(23, 59, 59, 999);  
  
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
        startDate.setHours(0, 0, 0, 0);
  
        return checkDate >= startDate && checkDate <= endDate;
      });
  
      if (dayEvents.length > 0) {
        dayEvents.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
        return `highlight-${dayEvents[0].id}`;
      }
    }
    return null;
  };
  
  const updateTileStyles = () => {
    const styleElement = document.getElementById('dynamic-styles');
    const styleRules = events.map(event =>
      `.react-calendar .highlight-${event.id} { background-color: ${event.color}; color: #fff; }`
    ).join("\n");
  
    if (styleElement) {
      styleElement.textContent = styleRules; 
    } else {
      const newStyleElement = document.createElement('style');
      newStyleElement.id = 'dynamic-styles';
      newStyleElement.textContent = styleRules;
      document.head.appendChild(newStyleElement);
    }
  };
  
  useEffect(() => {
    updateTileStyles();
  }, [events]);

  const handleDayClick = (value) => {
    const eventsForDay = findEventsForDate(value, events);
    if (eventsForDay.length > 0) {
      const selectedEvent = eventsForDay.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))[0];
      handleEventSelect(selectedEvent);
    }
    else {
        handleClosePanel();
    }
  };

  const handleBackdropClick = () => {
    handleClosePanel();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="home">
      <Steamed />
      <br></br>
      <div className="container">
        {userDetails.type !== 'Standard' && (
            <button onClick={handleCreateEvent}>Create Event</button>
        )}
        {isModalOpen && (
          <>
            <div className="backdrop backdrop-active" onClick={handleCloseModal}></div>
            <EventsThreeTabbedModal 
                onClose={handleCloseModal} 
                onEventCreate={handleEventCreate}
            />
          </>
        )}

            {isPanelOpen && selectedEvent && (
              <>
                <div className="backdrop backdrop-active" onClick={handleBackdropClick}></div>
                <EventDetailsPanel 
                    event={selectedEvent} 
                    onClose={handleClosePanel} 
                    onColorChange={handleColorChange}
                    setEvents={setEvents}
                    fetchEvents={fetchEvents}
                    toggleScrollability={toggleScrollability}
                    userDetails={userDetails}
                />
              </>
            )}
            
        <div className="title">Schedule</div>
        <Calendar
          onChange={onChange}
          value={value}
          tileClassName={tileClassName}
          onClickDay={handleDayClick}
        />

        <input
          type="text"
          className="search-bar"
          value={filter}
          onChange={handleSearchChange}
          placeholder="Search events"
        />
        
        <table className="table upcoming-events">
          <thead>
            <tr>
              <th onClick={toggleSortDirection}>Date {sortDirection === 'asc' ? '↓' : '↑'}</th>
              <th>Event Name</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
          {displayedEvents.map(event => {
            const formattedStart = format(new Date(event.startDateTime), 'MM/dd/yyyy');
            const formattedEnd = format(new Date(event.endDateTime), 'MM/dd/yyyy');
            const dateDisplay = formattedStart === formattedEnd ? formattedStart : `${formattedStart} to ${formattedEnd}`;

            return (
              <tr key={event.id} style={{ backgroundColor: event.color, color: '#ffffff' }}>
                <td>{dateDisplay}</td>
                <td>{event.title}</td>
                <td className="details-cell" onClick={() => handleEventSelect(event)}>Click to View</td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      </div>
    </>
  );
}

export default Cal;
