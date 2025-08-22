// visual appearance:
// welcome to the events page 
// (/ list of events pulled from db, guaranteed sync with the calendar)
// events displayed in rows, thumbnail format: modificable picture under text (event name), hovering over it will make it expand, clicking it will lead to the event page 
// as implied each event has its own page, complete with notes, comments, and related images
// major concerns:
// concurrency issues: events also need to be displayed / modified in calendar view, which is its own page
// same story applies to images, since we have an image gallery w/ an event tagging system
//      

// Backup code:

import React, { useState, useEffect, useRef } from 'react';
import Steamed from './Steamed.jsx';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Cal.css';
import checkAuth from './CheckAuth.jsx';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import EventModal from './EventModal.jsx';

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
            const parsedEvents = data.map(event => {
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
                participants: userDetails.user_id || [],
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
    user_id: '',
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
      } catch (error) {
          console.error('Error deleting event:', error);
      }
  };

  const handleBackdropClick = () => {
    handleClosePanel();
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
  
        const updatedEvent = {
          ...commonAttributes,
          id: updatedEventData.id,
          startDateTime,
          endDateTime,
          participants: updatedEventData.participants || [],
          temp: false,
        };
  
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === updatedEvent.id ? updatedEvent : event
          )
        );
  
        setIsPanelOpen(false);
        toggleScrollability(true);
      } else {
        console.error('Failed to update event:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating event:', error);
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
  

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="home">
        <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
        </header>
      <br></br>
      <div className="container">
        {userDetails.type !== 'Standard' && (
            <button onClick={handleCreateEvent}>Create Event</button>
        )}
        {isModalOpen && (
          <>
            <div className="backdrop backdrop-active" onClick={handleCloseModal}></div>
            <EventModal 
                onClose={handleCloseModal} 
                mode="edit"
                eventData={selectedEvent}
                onEventCreate={handleEventCreate}
            />
          </>
        )}

            {isPanelOpen && selectedEvent && (
              <>
                <div className="backdrop backdrop-active" onClick={handleBackdropClick}></div>
                <EventsFourTabbedModal
                    eventData={selectedEvent}
                    onClose={handleClosePanel}
                    onEventUpdate={handleEventUpdate}
                    userDetails={userDetails}
                    handleDelete={handleDelete}
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

        <div className="events-grid">
          {displayedEvents.map(event => (
            <div 
              key={event.id} 
              className="event-card"
              onClick={() => handleEventSelect(event)}
            >
              <div 
                className="event-image"
                style={{ backgroundImage: `url(${event.image_url || '/default-event.jpg'})` }}
              ></div>
              <div className="event-info">
                <h3 className="event-title">{event.title}</h3>
                <p className="event-details">
                  {event.location} | {format(new Date(event.startDateTime), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
}

export default Cal;
