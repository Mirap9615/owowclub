import React, { useState, useEffect, useRef } from 'react';
import Steamed from './Steamed.jsx';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Cal.css';
import { HexColorPicker } from 'react-colorful';

// Misc 
function findEventsForDate(date, events) {
    return events.filter(event => {
      let eventDate = new Date(event.date + 'T12:00:00');
      eventDate = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000));
      return date.toDateString() === eventDate.toDateString();
    });
}

// Coloring 
function getColor(index) {
    const colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
            '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
            '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
            '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
            '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
            '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
            '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
            '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
            '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
            '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
    return colors[index % colors.length];
}  

function Cal() {
  const [value, onChange] = useState(new Date());
  const [events, setEvents] = useState([
    { id: 1, date: '2024-06-20', title: 'Meeting', description: 'Quarterly planning meeting, a Jib and a Jab', color: getColor(1), members: ["Joanna"] },
    { id: 2, date: '2024-06-21', title: 'Workshop', description: 'Artistic development workshop', color: getColor(4), members: ["Jessica"] },
  ]);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleEventSelect = (event) => {
    document.body.classList.add('body-no-scroll');
    setSelectedEvent(event);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setIsEditMode(false); 
    setIsColorPickerVisible(false); 
    setSelectedEvent(null); 
    document.body.classList.remove('body-no-scroll');
    };


  useEffect(() => {
    if (selectedEvent) {
      const currentEvent = events.find(event => event.id === selectedEvent.id);
      setSelectedEvent(currentEvent);
    }
  }, [events]);
  
  const [originalColor, setOriginalColor] = useState(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const toggleColorPicker = () => setIsColorPickerVisible(!isColorPickerVisible);
  const [isEditMode, setIsEditMode] = useState(false);
  const toggleEditMode = () => {
    if (!isEditMode) {
        setIsEditMode(true);
        setOriginalColor(event.color);
    } else {
        setIsEditMode(false);
        setIsColorPickerVisible(false); 
        handleColorRevert();
    }
  };

  const titleRef = useRef(null);
  const dateRef = useRef(null);
  const descRef = useRef(null);

  const handleSave = () => {
    const updatedTitle = titleRef.current.textContent;
    const updatedDate = dateRef.current.textContent;
    const updatedDesc = descRef.current.textContent;
    const updatedEvents = events.map(event => 
      event.id === selectedEvent.id ? 
      { ...event, title: updatedTitle, date: updatedDate, description: updatedDesc } :
      event
    );

    setEvents(updatedEvents); 
    setIsEditMode(false); 
    setIsColorPickerVisible(false);
    setOriginalColor(null);
  };

  const handleColorRevert = () => {
    if (selectedEvent) {
      onColorChange({ hex: originalColor }, selectedEvent.id);
    }
  };
  
  const EventDetailsPanel = ({ event, onClose, onColorChange }) => (

    isPanelOpen && event ? (
      <div className="side-panel">
        <div className="card-title" contentEditable={isEditMode} ref={titleRef}>{event.title}</div>
        <div className="card-date" contentEditable={isEditMode} ref={dateRef}>{event.date}</div>
        <div className="card-desc" contentEditable={isEditMode} ref={descRef}>{event.description}</div>
        <div className="card-part">{"Participating Members"}</div>
        <div className="card-memb">{event.members.join(', ')}</div>
        <button className="card-join" onClick={null /** joinEvent **/}>Join</button>
        <br></br>
        {isEditMode && (
            <button className="card-ccol" onClick={toggleColorPicker}>Change Color</button>
        )}
        <button className="card-edit" onClick={isEditMode ? handleSave : toggleEditMode}>
            {isEditMode ? "Save" : "Edit"}
        </button>

        {isColorPickerVisible && isEditMode && (
            <HexColorPicker
            color={event.color}
            onChange={(color) => onColorChange({ hex: color }, event.id)}
            />
        )}

        <button className="card-close" onClick={onClose}>Close</button>
      </div>
    ) : null
  );

  
  const handleColorChange = (color, eventId) => {
    const updatedEvents = events.map(event =>
      event.id === eventId ? { ...event, color: color.hex } : event
    );
    setEvents(updatedEvents);
  };  

  // Sorting and Searching
  const [filter, setFilter] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [displayedEvents, setDisplayedEvents] = useState([]);

  useEffect(() => {
    const sortedEvents = [...events].sort((a, b) => (
      sortDirection === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date)
    ));
    const filteredEvents = sortedEvents.filter(event => event.title.toLowerCase().includes(filter.toLowerCase()));
    setDisplayedEvents(filteredEvents);
  }, [sortDirection, filter, events]);


  const toggleSortDirection = () => {
    setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleSearchChange = (e) => {
    setFilter(e.target.value);
  };

  useEffect(() => {
    const originalDisplay = document.body.style.display;
    document.body.style.display = 'block';
    return () => {
      document.body.style.display = originalDisplay;
    };
  }, []);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = events.filter(event => {
        let eventDate = new Date(event.date + 'T12:00:00');
        eventDate = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000));
        return eventDate.toDateString() === date.toDateString();
      });

      if (dayEvents.length > 0) {
        console.log("Applying color:", dayEvents[0].color, "to date:", date.toDateString());
        return `highlight-${dayEvents[0].id}`;
      }
    }
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
  

  useEffect(() => {
    console.log("Events:", events);
  }, [events]);

  const handleDayClick = (value) => {
    const eventsForDay = findEventsForDate(value, events);
    if (eventsForDay.length > 0) {
      handleEventSelect(eventsForDay[0]);
    }
  };
  
  return (
    <>
      <Steamed />
      <div className="container">
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
            {displayedEvents.map(event => (
                <tr key={event.id} style={{ backgroundColor: event.color, color: '#ffffff' }}>
                    <td>{event.date}</td>
                    <td>{event.title}</td>
                    <td className="details-cell" onClick={() => handleEventSelect(event)}>Click to View</td>
                </tr>
            ))}
          </tbody>
        </table>
        <EventDetailsPanel event={selectedEvent} onClose={handleClosePanel} onColorChange={handleColorChange} />
      </div>
    </>
  );
}

export default Cal;
