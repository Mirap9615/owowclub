import React, { useState } from 'react';
import './EventsModal.css';
import { HexColorPicker } from 'react-colorful';

const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota",
    "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
    "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
    "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal",
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
    "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
    "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
    "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
    "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan",
    "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam",
    "Yemen", "Zambia", "Zimbabwe"
];

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
            cover_image_url: '',
        };

    const [eventMedia, setEventMedia] = useState([]);
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

    const handleCoverImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('media', file);

        try {
            const response = await fetch('/upload-media', {
                method: 'POST',
                body: uploadData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData((prev) => ({
                    ...prev,
                    cover_image_url: data.url,
                }));
            } else {
                console.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
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
                        {formData.country === "United States" ? (
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                            >
                                <option value="">Select a state...</option>
                                {US_STATES.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                placeholder="Enter state or region"
                                onChange={handleInputChange}
                            />
                        )}
                    </label>
                    <label>
                        Country
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                        >
                            <option value="">Select a country...</option>
                            {COUNTRIES.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
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
                        <label>
                            Cover Image
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageUpload}
                            />
                            {formData.cover_image_url && (
                                <div className="cover-image-preview">
                                    <img src={formData.cover_image_url} alt="Cover Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }} />
                                </div>
                            )}
                            {eventMedia.length > 0 && (
                                <div className="event-media-picker" style={{ marginTop: '10px' }}>
                                    <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>Or select from event media:</p>
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                        {eventMedia.filter(m => m.media_type === 'image').map(media => (
                                            <img
                                                key={media.id}
                                                src={media.url}
                                                alt="Event Media"
                                                style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    objectFit: 'cover',
                                                    cursor: 'pointer',
                                                    border: formData.cover_image_url === media.url ? '2px solid blue' : '1px solid #ccc',
                                                    borderRadius: '4px'
                                                }}
                                                onClick={() => setFormData(prev => ({ ...prev, cover_image_url: media.url }))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
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
