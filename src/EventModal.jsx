import React, { useState } from 'react';
import './EventsModal.css';
import { HexColorPicker } from 'react-colorful';

const EventModal = ({ onClose, mode, eventData, onEventUpdate }) => {
    const isEditMode = mode === 'edit';

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) return ''; 
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    };

    const initialFormData = isEditMode
        ? {
            ...eventData,
            event_date: eventData.event_date ? formatDate(eventData.event_date) : '',
        }
        : {
            title: '',
            type: '',
            exclusivity: '',
            description: '',
            event_date: '',
            start_time: '',
            end_time: '',
            is_physical: true, 
            location: '',
            zip_code: '',
            city: '',
            state: '',
            country: '',
            virtual_link: '',
            color: '',
        };

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialFormData);
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'is_physical' ? value === 'true' : value, 
        }));
    };

    const toggleColorPicker = () => {
        setIsColorPickerVisible(!isColorPickerVisible);
    };

    const handleSave = () => {
        console.log('onEventUpdate is:', onEventUpdate);
        console.log('formData:', formData);
        onEventUpdate(formData);
        onClose();
    };

    const renderLocationSection = () => {
        if (formData.is_physical) {
            // physical
            return (
                <>
                    <label>
                        Address
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Zip Code
                        <input
                            type="text"
                            name="zip_code"
                            value={formData.zip_code}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        City
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        State
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>
                        Country
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                        />
                    </label>
                </>
            );
        } else {
            // virtual
            return (
                <label>
                    Virtual Link
                    <input
                        type="text"
                        name="virtual_link"
                        value={formData.virtual_link}
                        onChange={handleInputChange}
                    />
                </label>
            );
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="step-content">
                        <h3>Overview</h3>
                        <label>
                            Event Title
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </label>
                        <label>
                            Event Type
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                            >
                                <option value="none">Select...</option>
                                <option value="travel">Travel Adventure</option>
                                <option value="tea-party">Tea Party</option>
                                <option value="golf">Golf Practice</option>
                                <option value="concert">Concert or Live Show</option>
                                <option value="arts-crafts">Arts & Crafts Workshop</option>
                                <option value="entertainment">General Entertainment</option>
                                <option value="cooking-food">Cooking, Baking, or Food Tasting</option>
                                <option value="sports">Sports or Physical Activity</option>
                                <option value="hiking-camping">Hiking or Camping Trip</option>
                                <option value="book-club">Book Club Meeting</option>
                                <option value="yoga-meditation">Yoga or Meditation Session</option>
                                <option value="picnic">Picnic or Outdoor Gathering</option>
                                <option value="movie-screening">Movie Screening</option>
                                <option value="charity-fundraising">Charity or Fundraising Event</option>
                                <option value="arcade-escape">Arcade or Escape Room</option>
                                <option value="wine-tasting">Wine or Craft Beer Tasting</option>
                                <option value="karaoke">Karaoke Night</option>
                                <option value="volunteer-day">Community Volunteer Day</option>
                                <option value="fishing-trip">Fishing Trip</option>
                                <option value="golfing">Golfing Outing</option>
                                <option value="potluck">Potluck Gathering</option>
                                <option value="art-gallery">Art Gallery Tour</option>
                                <option value="museum">Museum Visit</option>
                                <option value="other">Other</option>
                                <option value="custom">Custom...</option>
                            </select>
                        </label>
                        <label>
                            Exclusivity
                            <select
                                name="exclusivity"
                                value={formData.exclusivity}
                                onChange={handleInputChange}
                            >
                                <option value="open">Open</option>
                                <option value="invite-only">Invite Only</option>
                            </select>
                        </label>
                        <label>
                            Description
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </label>
                        <div className="color-picker-section">
                            <label>Event Color</label>
                            <div className="color-picker-container">
                                <div
                                    className="color-preview"
                                    style={{ backgroundColor: formData.color || '#d3d3d3' }}
                                />
                                <button
                                    className="pick-color-button"
                                    onClick={toggleColorPicker}
                                >
                                    {formData.color ? "Change Color" : "Pick Color"}
                                </button>
                            </div>
                            {isColorPickerVisible && (
                                <div className="color-picker-popover">
                                    <HexColorPicker
                                        color={formData.color || '#d3d3d3'}
                                        onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                                    />
                                    <button className="close-button" onClick={toggleColorPicker}>
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h3>Date & Location</h3>
                        <label>
                            Date
                            <input
                                type="date"
                                name="event_date"
                                value={formData.event_date}
                                onChange={handleInputChange}
                            />
                        </label>
                        <label>
                            Start Time
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                            />
                        </label>
                        <label>
                            End Time
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                            />
                        </label>
                        <div className="location-toggle">
                            <label>
                                Location Type
                                <select
                                    name="is_physical"
                                    value={formData.is_physical}
                                    onChange={handleInputChange}
                                >
                                    <option value="true">Physical</option>
                                    <option value="false">Virtual</option>
                                </select>
                            </label>
                            {renderLocationSection()}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="event-modal">
            <div className="modal-header">
                <h2>{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
                <div className="progress-bar">
                    <div
                        className={`progress-step ${step === 1 ? 'active' : ''}`}
                        onClick={() => setStep(1)}
                    >
                        Overview
                    </div>
                    <div
                        className={`progress-step ${step === 2 ? 'active' : ''}`}
                        onClick={() => setStep(2)}
                    >
                        Date & Location
                    </div>
                </div>
                <button className="close-button-modal" onClick={onClose}>
                    &times;
                </button>
            </div>

            <div className="modal-body">{renderStep()}</div>

            <div className="modal-footer">
                <button onClick={handleBack} disabled={step === 1}>
                    Back
                </button>
                <button onClick={handleNext} disabled={step === 2}>
                    Next
                </button>
                <button onClick={handleSave}>
                    {isEditMode ? 'Save Changes' : 'Create Event'}
                </button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default EventModal;
