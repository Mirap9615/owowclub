import React, { useState, useEffect } from 'react';
import {
  startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addYears, subYears
} from 'date-fns';
import { MapPin, Video, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CalendarView.css';

const CalendarView = ({ events, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controls
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextYear = () => setCurrentDate(addYears(currentDate, 1));
  const prevYear = () => setCurrentDate(subYears(currentDate, 1));

  // Get months to display
  const monthsToDisplay = (isMobile || viewMode === 'month')
    ? [currentDate] // Just the current month
    : eachMonthOfInterval({
        start: startOfYear(currentDate),
        end: endOfYear(currentDate)
      });

  const getEventsForDay = (day) => {
    // Events array contains objects with startDateTime and endDateTime
    return events.filter(event => {
       const start = new Date(event.startDateTime);
       const end = new Date(event.endDateTime);
       // Normalize to midnight for accurate day comparison
       start.setHours(0,0,0,0);
       end.setHours(23,59,59,999);
       const checkDay = new Date(day);
       checkDay.setHours(12,0,0,0);
       return checkDay >= start && checkDay <= end;
    });
  };

  const handleDayClick = (day, dayEvents) => {
    if (dayEvents.length > 0) {
      // Open sidebar with the first event (or handle multiple in sidebar later)
      setSelectedEvent(dayEvents[0]);
      setIsSidebarOpen(true);
    } else {
      // Empty day -> prompt to create
      onDateClick(day);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setSelectedEvent(null), 300); // Wait for transition
  };

  return (
    <div className="calendar-view-container">
      <div className="calendar-header-wrapper">
        <div className="calendar-header">
          {(isMobile || viewMode === 'month') ? (
            <div className="calendar-controls">
              <button onClick={prevMonth}>&lt;</button>
              <h2>{format(currentDate, 'MMMM yyyy')}</h2>
              <button onClick={nextMonth}>&gt;</button>
            </div>
          ) : (
            <div className="calendar-controls">
              <button onClick={prevYear}>&lt;</button>
              <h2>{format(currentDate, 'yyyy')}</h2>
              <button onClick={nextYear}>&gt;</button>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'month' ? 'active' : ''} 
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button 
              className={viewMode === 'year' ? 'active' : ''} 
              onClick={() => setViewMode('year')}
            >
              Year
            </button>
          </div>
        )}
      </div>

      <div className={`calendar-grid ${(isMobile || viewMode === 'month') ? 'mobile-grid single-month-grid' : 'desktop-grid'}`}>
        {monthsToDisplay.map((monthDate, idx) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const startDate = startOfWeek(monthStart);
          const endDate = endOfWeek(monthEnd);
          const days = eachDayOfInterval({ start: startDate, end: endDate });

          return (
            <div key={idx} className="calendar-month">
              {(!isMobile && viewMode === 'year') && <h3 className="month-title">{format(monthDate, 'MMMM')}</h3>}
              <div className="days-of-week">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="dow-label">{d}</div>
                ))}
              </div>
              <div className="days-grid">
                {days.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, monthDate);
                  const isTodayDate = isToday(day);
                  
                  // Style logic
                  let backgroundColor = '';
                  let className = `day-cell ${!isCurrentMonth ? 'outside-month' : ''} ${isTodayDate ? 'today' : ''}`;
                  
                  if (dayEvents.length > 0 && isCurrentMonth) {
                    className += ' has-event';
                    // Use the color of the first event, or a default
                    backgroundColor = dayEvents[0].color || 'var(--color-primary-gold)';
                  }

                  return (
                    <div
                      key={day.toString()}
                      className={className}
                      onClick={() => handleDayClick(day, dayEvents)}
                    >
                      <div 
                        className="day-number" 
                        style={backgroundColor ? { backgroundColor, color: '#fff', border: 'none' } : {}}
                      >
                        {format(day, 'd')}
                      </div>
                      {dayEvents.length > 1 && isCurrentMonth && (
                        <div className="multi-event-dot"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Overlay */}
      <div className={`calendar-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      <div className={`calendar-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {selectedEvent && (
          <div className="sidebar-content">
            <div 
              className="sidebar-header-image" 
              style={{ 
                backgroundImage: `url(${selectedEvent.cover_image_url || selectedEvent.image_url || ''})`,
                backgroundColor: selectedEvent.color || 'var(--color-primary-gold)'
              }}
            ></div>
            <div className="sidebar-details">
              <span className="sidebar-date">{format(new Date(selectedEvent.startDateTime), 'MMMM d, yyyy')}</span>
              <h2>{selectedEvent.title}</h2>
              <div className="sidebar-meta">
                 {selectedEvent.is_physical ? <MapPin size={16} /> : <Video size={16} />}
                 <span>{selectedEvent.is_physical ? 'In-Person' : 'Virtual'}</span>
              </div>
              
              <div className="sidebar-description">
                <p>{selectedEvent.description || 'No description provided.'}</p>
              </div>

              <Link to={`/events/${selectedEvent.slug}`} className="view-full-event-btn">
                View Full Event
              </Link>
              
              <button className="sidebar-close-btn-bottom" onClick={closeSidebar}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CalendarView;
