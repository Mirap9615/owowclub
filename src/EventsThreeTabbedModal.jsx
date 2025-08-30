import React, { useState } from 'react';
import './EventsModal.css';
import { HexColorPicker } from 'react-colorful';

const EventsThreeTabbedModal = ({ onClose, onEventCreate }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        exclusivity: '',
        description: '',
        date: null,
        startTime: '',
        endTime: '',
        location: '',
        color: '',
    });

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            onEventCreate(formData);
            onClose();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };
    

    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

    const toggleColorPicker = () => {
        setIsColorPickerVisible(!isColorPickerVisible);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="step-content">
                        <h3>Overview</h3>
                        <label>
                            Event Title 
                            <input name="title" value={formData.title} onChange={handleInputChange} />
                        </label>
                        <label>
                            Event Type
                            <select name="type" value={formData.type} onChange={handleInputChange}>
                                <option value="none">Select...</option>
                                <option value="travel">Travel Adventure</option>
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
                            <select name="exclusivity" value={formData.exclusivity} onChange={handleInputChange}>
                                <option value="open">Open</option>
                                <option value="invite-only">Invite Only</option>
                            </select>
                        </label>
                        <label>
                            Description
                            <textarea name="description" value={formData.description} onChange={handleInputChange} />
                        </label>
                    </div>
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
                                        onChange={(color) => setFormData({ ...formData, color })}
                                    />
                                    <div className="color-picker-buttons">
                                        <button className="close-button" onClick={toggleColorPicker}>Close</button>
                                        <button className="done-button" onClick={toggleColorPicker}>Done</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h3>Date & Location</h3>
                        <label>
                            Date
                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                        </label>
                        <label>
                            Start Time
                            <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                        </label>
                        <label>
                            End Time
                            <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} />
                        </label>
                        <label>
                            Location
                            <input
                                type="text"
                                name="location"
                                placeholder="Address or virtual link"
                                value={formData.location}
                                onChange={handleInputChange}
                            />
                        </label>
                    </div>
                );         
            default:
                return null;
        }
    };

    return (
        <div className="event-modal">
            <div className="modal-header">
                <h2>{formData.title || 'Create New Event'}</h2>
                <div className="progress-bar">
                    <div 
                        className={`progress-step ${step == 1 ? 'active' : ''}`}
                        onClick={() => setStep(1)}
                    >Overview</div>
                    <div 
                        className={`progress-step ${step == 2 ? 'active' : ''}`}
                        onClick={() => setStep(2)}
                    >Date & Location</div>
                </div>

                <button className="close-button-modal" onClick={onClose} aria-label="Close">
                    &times;
                </button>
            </div>

            <div className="modal-body">{renderStep()}</div>

            <div className="modal-footer">
                <button onClick={handleBack} disabled={step === 1}>
                    Back
                </button>
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleNext}>{step === 2 ? 'Create Event' : 'Next'}</button>
            </div>
        </div>
    );
};

export default EventsThreeTabbedModal;
