import React, { useState } from 'react';
import './Request.css';
import Steamed from './Steamed.jsx'

const Request = () => {
  const [step, setStep] = useState(1); 
  // step 1 
  const [invitationCode, setInvitationCode] = useState(''); 
  const [full_name, setFullName] = useState(''); 
  // step 2 
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [interests, setInterests] = useState([]);
  // step 3
  const [availability, setAvailability] = useState(''); 
  const [referral, setReferral] = useState('');
  const [comments, setComments] = useState('');
  const [membershipType, setMembershipType] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');
  const [propertyAvailability, setPropertyAvailability] = useState('');

  // binary outcome 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    setInterests(prev =>
      checked ? [...prev, value] : prev.filter(item => item !== value)
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!invitationCode.trim()) {
        setError('Please enter your invitation code.');
        return;
      }

      try {
            const response = await fetch('/api/validate-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: invitationCode }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setError('');
                setStep(2); 
            } else {
                setError(data.error || 'Invalid invitation code.');
            }
        } catch (error) {
            console.error('Error validating code:', error);
            setError('Failed to validate code. Please try again later.');
        }

        return;
    }

    if (step === 2) {
      if (!full_name || !email || !phone || !reason || interests.length === 0) {
        setError('Please fill out all required fields.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Invalid email format.');
        return;
      }

      if (phone && !RegExp(/^[+]*[0-9]{1,4}-[0-9]{10}$/g).test(phone)) {
        setError('Invalid phone number.');
      }
    }

    setError('');
    setStep(step + 1); 
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("mb: " + membershipType);
    
    try {
      const response = await fetch('/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationCode, full_name, email, phone, reason, interests, availability, referral, comments, membershipType,
          propertyAddress: membershipType === 'Travel Host' ? propertyAddress : null,
          propertyType: membershipType === 'Travel Host' ? propertyType : null,
          propertyDescription: membershipType === 'Travel Host' ? propertyDescription : null,
          propertyAvailability: membershipType === 'Travel Host' ? propertyAvailability : null,
        }),
      });

      if (response.ok) {
        setError('');
        setStep(4); // step 4 being the post-submission page 
        setFullName('');
        setEmail('');
        setPhone('');
        setReason('');
        setInterests([]);
        setAvailability('');
        setReferral('');
        setComments('');
      } else {
        const data = await response.json();
        setError(data.error || 'Submission failed.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Submission failed. Please try again.');
    }
  };

  // Renders the form content for each step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2>Step 1: Invitation Code</h2>
            <div className="input-group">
              <label>Invitation Code</label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                required
              />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2>Step 2: Personal Information</h2>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Why do you want to join the club?</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="input-group-request">
              <label>What types of activities interest you most?</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    value="Travel"
                    onChange={handleCheckboxChange}
                    checked={interests.includes('Travel')}
                  />
                  Travel
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Shows"
                    onChange={handleCheckboxChange}
                    checked={interests.includes('Shows')}
                  />
                  Shows
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Workshops"
                    onChange={handleCheckboxChange}
                    checked={interests.includes('Workshops')}
                  />
                  Workshops
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="Showcases (of Art and Media)"
                    onChange={handleCheckboxChange}
                    checked={interests.includes('Showcases (of Art and Media)')}
                  />
                  Art Displays
                </label>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2>Step 3: Additional Information</h2>
            <div className="input-group">
              <label>Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                required
              >
                <option value="">Select Availability</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Weekends">Weekends</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

        <div className="input-group">
            <label>Membership Type</label>
            <select
                value={membershipType}
                onChange={(e) => setMembershipType(e.target.value)}
                required
            >
                <option value="">Select Membership Type</option>
                <option value="Standard">Standard</option>
                <option value="Travel Host">Travel Host</option>
            </select>
        </div>

        {membershipType === 'Travel Host' && (
            <>
                <div className="input-group">
                    <label>Property Address</label>
                    <input
                        type="text"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Type of Property</label>
                    <input
                        type="text"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Property Description</label>
                    <textarea
                        value={propertyDescription}
                        onChange={(e) => setPropertyDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label>Property Availability</label>
                    <select
                        value={propertyAvailability}
                        onChange={(e) => setPropertyAvailability(e.target.value)}
                        required
                    >
                        <option value="">Select Availability</option>
                        <option value="Available Now">Available Now</option>
                        <option value="Seasonal">Seasonal</option>
                    </select>
                </div>
            </>
        )}
            <div className="input-group">
              <label>How did you hear about us?</label>
              <textarea
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Additional Comments or Questions (Optional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
          </>
        );
        case 4:
          return (
            <>
              <h2>Application Submitted Successfully!</h2>
              <div className="success-message">
                {success}
              </div>
              <button 
                type="button" 
                className="submit-button" 
                onClick={() => window.location.href = '/login'} 
              >
                Back to Login
              </button>
            </>
          );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
      </header>
      <div className="centerer-er">
        <div className="standard-container">
          <h2>Club Application</h2>
          <form onSubmit={handleSubmit}>
            {renderStep()}

            {error && <div className="error">{error}</div>}

            {step < 4 && ( 
              <div className="button-group">
                <button className="back-button"
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1} 
                >
                  Back
                </button>
                {step < 3 ? (
                  <button className="next-button" type="button" onClick={handleNext}>
                    Next
                  </button>
                ) : (
                  <button type="submit" className="submit-button">
                    Submit Application
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default Request;