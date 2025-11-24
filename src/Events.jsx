import React, { useState, useEffect, useRef } from 'react';
import Steamed from './Steamed.jsx';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './EventsPage.css';
import checkAuth from './CheckAuth.jsx';
import { HexColorPicker } from 'react-colorful';
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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: '',
    user_id: '',
    type: '',
  });

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
            slug: event.slug,
            participants: event.participants || [],
            is_physical: event.is_physical,
            zip_code: event.zip_code,
            city: event.city,
            state: event.state,
            country: event.country,
            virtual_link: event.virtual_link,
            cover_image_url: event.cover_image_url,
          };
        });
        console.log(parsedEvents);
        setEvents(parsedEvents);
      } else {
        throw new Error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
      description: formData.description.trim() || 'Default description',
      event_date: formData.event_date || new Date().toISOString().split("T")[0],
      start_time: formData.start_time || '16:00',
      end_time: formData.end_time || '21:00',
      is_physical: formData.is_physical,
      location: formData.is_physical ? formData.location.trim() || 'Unset' : null,
      zip_code: formData.is_physical ? formData.zip_code.trim() || '' : null,
      city: formData.is_physical ? formData.city.trim() || '' : null,
      state: formData.is_physical ? formData.state.trim() || '' : null,
      country: formData.is_physical ? formData.country.trim() || '' : null,
      virtual_link: !formData.is_physical ? formData.virtual_link.trim() || '' : null,
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
          is_physical: finalFormData.is_physical,
          location: finalFormData.location,
          zip_code: finalFormData.zip_code,
          city: finalFormData.city,
          state: finalFormData.state,
          country: finalFormData.country,
          virtual_link: finalFormData.virtual_link,
          type: finalFormData.type,
          exclusivity: finalFormData.exclusivity,
          participants: formData.participants || [],
          temp: false,
        };

        setEvents((prevEvents) => [...prevEvents, createdEvent]);
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

  const handleSearchChange = (e) => {
    setFilter(e.target.value);
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const Navigate = useNavigate();

  return (
    <>
      <div className="home">
        <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
        </header>
        <br></br>
        <div className="container">
          <h1>Events</h1>

          {userDetails.type !== 'Standard' && (
            <button className="event-ghost-button" onClick={handleCreateEvent}>Create Event</button>
          )}
          {isModalOpen && (
            <>
              <div className="backdrop backdrop-active" onClick={handleCloseModal}></div>
              <EventModal
                onClose={handleCloseModal}
                mode="create"
                onEventUpdate={handleEventCreate}
              />
            </>
          )}

          <input
            type="text"
            className="search-bar"
            value={filter}
            onChange={handleSearchChange}
            placeholder="Search events"
          />

          <div className="events-grid">
            {displayedEvents.map(event => {
              const formattedStart = format(new Date(event.startDateTime), 'MMM dd, yyyy');
              const formattedEnd = format(new Date(event.endDateTime), 'MMM dd, yyyy');
              const dateDisplay = formattedStart === formattedEnd ? formattedStart : `${formattedStart} to ${formattedEnd}`;

              const typeDisplay = event.is_physical ? 'In-Person' : 'Virtual';

              const venueDisplay = event.is_physical
                ? `${event.location || 'Unset'}, ${event.city || ''}, ${event.state || ''}, ${event.country || ''} ${event.zip_code || ''}`.trim().replace(/,\s*$/, '')
                : event.virtual_link
                  ? <a href={event.virtual_link} target="_blank" rel="noopener noreferrer">{event.virtual_link}</a>
                  : 'Online Event';

              const backgroundStyle = event.cover_image_url
                ? { backgroundImage: `url(${event.cover_image_url})` }
                : event.image_url
                  ? { backgroundImage: `url(${event.image_url})` }
                  : { backgroundColor: event.color };

              return (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => Navigate(`/events/${event.slug}`)}
                >
                  <div className="event-image" style={backgroundStyle}></div>

                  <div className="event-info">
                    <h3 className="event-title">{event.title}</h3>

                    <p className="event-meta">
                      <span className="event-type">{typeDisplay}</span> | <span className="event-date">{dateDisplay}</span>
                    </p>

                    <p className="event-venue">{venueDisplay}</p>

                    {event.description && (
                      <p className="event-description">{event.description.length > 120 ? `${event.description.substring(0, 120)}...` : event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>


        </div>
      </div>
    </>
  );
}

export default Cal;
