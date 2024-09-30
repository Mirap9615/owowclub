import React, { useState } from 'react';
import './EventsFourTabbedModal.css';
import { HexColorPicker } from 'react-colorful';

const EventsFourTabbedModal = ({ onClose, eventData, onEventUpdate }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(eventData);
    const [isEditMode, setIsEditMode] = useState(false); 
    const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else if (isEditMode) {
            // Save changes in edit mode
            onEventUpdate(formData);
            setIsEditMode(false);
        } else {
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

    const toggleColorPicker = () => {
        setIsColorPickerVisible(!isColorPickerVisible);
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="step-content">
                        <h3>Details</h3>
                        <label>
                            Event Title
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                disabled={!isEditMode} // Disable input if not in edit mode
                            />
                        </label>
                        <label>
                            Event Type
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                disabled={!isEditMode} // Disable input if not in edit mode
                            >
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
                            <select
                                name="exclusivity"
                                value={formData.exclusivity}
                                onChange={handleInputChange}
                                disabled={!isEditMode}
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
                                disabled={!isEditMode}
                            />
                        </label>
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
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                disabled={!isEditMode}
                            />
                        </label>
                        <label>
                            Start Time
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                disabled={!isEditMode}
                            />
                        </label>
                        <label>
                            End Time
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                                disabled={!isEditMode}
                            />
                        </label>
                        <label>
                            Location
                            <input
                                type="text"
                                name="location"
                                placeholder="Address or virtual link"
                                value={formData.location}
                                onChange={handleInputChange}
                                disabled={!isEditMode}
                            />
                        </label>
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h3>Guests & Color Selection</h3>
                        <label>
                            Invite Guests
                            <input
                                type="text"
                                placeholder="Search for users..."
                                disabled={!isEditMode}
                            />
                        </label>
                        <div className="color-picker-section">
                            <label>Event Color</label>
                            <div className="color-picker-container">
                                <div
                                    className="color-preview"
                                    style={{ backgroundColor: formData.color || '#d3d3d3' }}
                                />
                                {isEditMode && (
                                    <button
                                        className="pick-color-button"
                                        onClick={toggleColorPicker}
                                    >
                                        {formData.color ? "Change Color" : "Pick Color"}
                                    </button>
                                )}
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
                    </div>
                );
            case 4:
                return (
                    <div className="step-content">
                        <h3>Members and Participation</h3>
                        <div>
                            <h4>Participating Members:</h4>
                            {formData.participants.length > 0
                                ? formData.participants.map((member) => (
                                    <div key={member.user_id}>{member.name}</div>
                                ))
                                : <div>No participants yet.</div>
                            }
                            <button onClick={() => { /* Handle Join/Leave Event */ }}>
                                {/* Display Join or Leave based on participation */}
                                {formData.participants.some(participant => participant.user_id === 'CURRENT_USER_ID') ? 'Leave' : 'Join'}
                            </button>
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
                <h2>{formData.title || 'Event Details'}</h2>
                <div className="progress-bar">
                    <div className={`progress-step ${step === 1 ? 'active' : ''}`}>Details</div>
                    <div className={`progress-step ${step === 2 ? 'active' : ''}`}>Date & Location</div>
                    <div className={`progress-step ${step === 3 ? 'active' : ''}`}>Guests & Color</div>
                    <div className={`progress-step ${step === 4 ? 'active' : ''}`}>Members & Participation</div>
                </div>
            </div>

            <div className="modal-body">{renderStep()}</div>

            <div className="modal-footer">
                <button onClick={handleBack} disabled={step === 1}>
                    Back
                </button>
                {isEditMode ? (
                    <button onClick={handleNext}>
                        {step === 4 ? 'Save Changes' : 'Next'}
                    </button>
                ) : (
                    <button onClick={toggleEditMode}>Edit</button>
                )}
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default EventsFourTabbedModal;
