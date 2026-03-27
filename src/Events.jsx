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
import { EVENT_TYPES } from './constants/eventTypes';
import { MapPin, Calendar as CalendarIcon, Video } from 'lucide-react';
import CalendarView from './CalendarView.jsx';

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
  const [selectedDate, setSelectedDate] = useState(null);
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
          const startDateTime = new Date(`${eventDate}T${event.start_time}Z`);
          const endDateTime = new Date(`${eventDate}T${event.end_time}Z`);

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

  const handleCreateEvent = (date = null) => {
    setSelectedDate(date instanceof Date ? date : null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleEventCreate = async (formData) => {
    const rawDate = formData.event_date || new Date().toISOString().split("T")[0];
    const rawStart = formData.start_time || '16:00';
    const rawEnd = formData.end_time || '21:00';

    const startObj = new Date(`${rawDate}T${rawStart}`);
    const endObj = new Date(`${rawDate}T${rawEnd}`);

    const finalFormData = {
      title: formData.title.trim() || 'New Event',
      type: formData.type || 'entertainment',
      exclusivity: formData.exclusivity || 'open',
      description: formData.description.trim() || 'Default description',
      event_date: startObj.toISOString().split("T")[0],
      start_time: startObj.toISOString().split("T")[1].substring(0, 5),
      end_time: endObj.toISOString().split("T")[1].substring(0, 5),
      is_physical: formData.is_physical,
      location: formData.is_physical ? formData.location?.trim() || 'Unset' : null,
      zip_code: formData.is_physical ? formData.zip_code?.trim() || '' : null,
      city: formData.is_physical ? formData.city?.trim() || '' : null,
      state: formData.is_physical ? formData.state?.trim() || '' : null,
      country: formData.is_physical ? formData.country?.trim() || '' : null,
      virtual_link: !formData.is_physical ? formData.virtual_link?.trim() || '' : null,
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

        const startDateTime = new Date(`${finalFormData.event_date}T${finalFormData.start_time}Z`);
        const endDateTime = new Date(`${finalFormData.event_date}T${finalFormData.end_time}Z`);

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
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedTitle, setSelectedTitle] = useState('all');
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [uniqueTitles, setUniqueTitles] = useState([]);

  useEffect(() => {
    // Extract unique titles from events, sorted by recency (newest first)
    const recencySorted = [...events].sort((a, b) => b.startDateTime.getTime() - a.startDateTime.getTime());
    const titles = Array.from(new Set(recencySorted.map(e => e.title)));
    setUniqueTitles(titles);
  }, [events]);

  useEffect(() => {
    let processedEvents = [...events];

    // 1. Filter by Title
    if (selectedTitle !== 'all') {
      processedEvents = processedEvents.filter(event => event.title === selectedTitle);
    }

    // 2. Filter by Search Text
    if (filter) {
      processedEvents = processedEvents.filter(event =>
        event.title.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // 3. Sort by Date
    processedEvents.sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.startDateTime - b.startDateTime;
      } else {
        return b.startDateTime - a.startDateTime;
      }
    });

    setDisplayedEvents(processedEvents);
  }, [sortDirection, filter, selectedTitle, events]);

  const handleSearchChange = (e) => {
    setFilter(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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

        <div className="container">
          <h1>Events</h1>

          <CalendarView events={events} onDateClick={handleCreateEvent} />

          <div className="controls-container" style={{ marginTop: '2rem' }}>
            {userDetails.user_id && userDetails.type !== 'Standard' && (
              <button className="event-ghost-button" style={{ marginRight: '1rem', marginBottom: 0 }} onClick={() => handleCreateEvent()}>Create Event</button>
            )}

            <input
              type="text"
              className="search-bar"
              value={filter}
              onChange={handleSearchChange}
              placeholder="Search events..."
            />

            <div className="filter-sort-group">
              <select
                className="type-filter-select"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
              >
                <option value="all">All Events</option>
                {uniqueTitles.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>

              <button className="sort-button" onClick={toggleSortDirection}>
                Sort by Date {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {isModalOpen && (
            <>
              <div className="backdrop backdrop-active" onClick={handleCloseModal}></div>
              <EventModal
                onClose={handleCloseModal}
                mode="create"
                onEventUpdate={handleEventCreate}
                initialDate={selectedDate}
              />
            </>
          )}

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
                    <div className="event-meta">
                      <span className="event-date"><CalendarIcon size={14} className="meta-icon" />{dateDisplay}</span>
                      <span className="event-type">{event.is_physical ? <MapPin size={14} className="meta-icon" /> : <Video size={14} className="meta-icon" />} {typeDisplay}</span>
                    </div>

                    <h3 className="event-title">{event.title}</h3>

                    {event.description && (
                      <p className="event-description"><LinkifyText text={event.description} /></p>
                    )}

                    <div className="event-location">
                      {venueDisplay}
                    </div>
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
