import React, { useState, useEffect, useRef } from 'react';
import Steamed from './Steamed.jsx';
import { useNavigate } from 'react-router-dom';
import checkAuth from './CheckAuth.jsx';
import { HexColorPicker } from 'react-colorful';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const EventDetailsPanel = ({ event, onClose, onTriggerEdit, onColorChange, setEvents, fetchEvents, toggleScrollability, userDetails }) => {
    if (event == null) return null;
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(() => event || {});
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalColor, setOriginalColor] = useState(null);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

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

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        if (!isEditMode) {
            setOriginalColor(event.color);
        } else {
            handleColorRevert();
        }
    };

    useEffect(() => {
        if (event && event.id !== eventData.id) {
            setEventData(event);
        }
    }, [event]);

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
                event.id === eventData.id ? { ...eventData, id: data.id } : event
            ));

            await fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
        }
        setIsEditMode(false);
        toggleScrollability(true);
    };

    return (
        <div className="side-panel" style={{ width: '350px' }}>
            
        </div>
    );
};


function Cal() {
    const [events, setEvents] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [displayedEvents, setDisplayedEvents] = useState([]);

    const fetchEvents = async () => {
        // Fetch events logic
    };

    const handleEventSelect = (event) => {
        toggleScrollability(false);
        setSelectedEvent(event);
        setIsPanelOpen(true);
    };

    const handleCreateEvent = async () => {
        const tempId = uuidv4();
        const newEvent = {
            id: tempId,
            startDateTime: new Date(),
            endDateTime: new Date(),
            title: 'Untitled Event',
            description: '',
            note: '',
            color: '#ff9999',
            temp: true
        };
        setSelectedEvent(newEvent);
        setIsPanelOpen(true);
        setEvents(prevEvents => [...prevEvents, newEvent]);
    };

    return (
        <>
            <Steamed />
            <br />
            <div className="container">
                <button onClick={handleCreateEvent}>Create Event</button>
                {isPanelOpen && selectedEvent && (
                    <EventDetailsPanel 
                        event={selectedEvent}
                        onClose={() => setIsPanelOpen(false)}
                        setEvents={setEvents}
                        fetchEvents={fetchEvents}
                    />
                )}
                <div className="title">Schedule</div>
                {/* Table rendering logic */}
            </div>
        </>
    );
}

export default Cal;