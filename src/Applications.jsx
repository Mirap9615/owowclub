import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkAuth from './CheckAuth.jsx';
import Steamed from './Steamed.jsx';
import './Applications.css';

const Applications = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState([]);
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      const authStatus = await checkAuth();
      setIsLoggedIn(authStatus.authenticated);
      setIsAdmin(authStatus.user?.admin || false);

      if (!authStatus.authenticated || !authStatus.user.admin) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('/api/applications');
        if (response.ok) {
          const data = await response.json();
          setApplications(data);
        } else {
          console.error('Failed to fetch applications');
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: status }),
      });
      if (response.ok) {
        setApplications((prevApplications) =>
          prevApplications.map((app) =>
            app.id === id ? { ...app, accepted: status } : app
          )
        );
      } else {
        console.error('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return app.accepted === null;
    if (activeTab === 'Accepted') return app.accepted === true;
    if (activeTab === 'Rejected') return app.accepted === false;
    return false;
  });

  const currentApplication = filteredApplications[currentApplicationIndex] || null;

  if (loading) {
    return <p>Loading applications...</p>;
  }

  return (
    <>
      <header className="top-bar-home">
          <Steamed />
          <h1>OWL<sup>2</sup> Club</h1>
      </header>

      <div className="applications-container">
        <h2>Membership Applications</h2>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'Pending' ? 'active' : ''}
            onClick={() => {
              setActiveTab('Pending');
              setCurrentApplicationIndex(0); // Reset index on tab switch
            }}
          >
            Pending
          </button>
          <button
            className={activeTab === 'All' ? 'active' : ''}
            onClick={() => {
              setActiveTab('All');
              setCurrentApplicationIndex(0);
            }}
          >
            All
          </button>
          <button
            className={activeTab === 'Accepted' ? 'active' : ''}
            onClick={() => {
              setActiveTab('Accepted');
              setCurrentApplicationIndex(0);
            }}
          >
            Accepted
          </button>
          <button
            className={activeTab === 'Rejected' ? 'active' : ''}
            onClick={() => {
              setActiveTab('Rejected');
              setCurrentApplicationIndex(0);
            }}
          >
            Rejected
          </button>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {filteredApplications.length === 0 ? (
            <h2>No applications in this category</h2>
          ) : (
            <div className="application-card">
              {/* Navigation Buttons */}
              <div className="navigation-buttons">
                <button
                  onClick={() => setCurrentApplicationIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentApplicationIndex === 0}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentApplicationIndex((prev) =>
                      Math.min(prev + 1, filteredApplications.length - 1)
                    )
                  }
                  disabled={currentApplicationIndex === filteredApplications.length - 1}
                >
                  Next
                </button>
              </div>

              <h3>{currentApplication.full_name}</h3>
              <div className="separator-ofu">Personal Information</div>
              <p><strong>Email:</strong> {currentApplication.email}</p>
              <p><strong>Phone:</strong> {currentApplication.phone || 'N/A'}</p>
              <p><strong>Membership Type:</strong> {currentApplication.membership_type}</p>
              <p><strong>Submitted:</strong> {new Date(currentApplication.created_at).toLocaleDateString()}</p>
              <p><strong>Interests:</strong> {currentApplication.interests.join(', ')}</p>
              <p><strong>Reason:</strong> {currentApplication.reason}</p>
              <p><strong>Referral:</strong> {currentApplication.referral}</p>
              <p><strong>Comments:</strong> {currentApplication.comments}</p>

              {/* Properties */}
              {currentApplication.membership_type === 'Travel Host' && currentApplication.properties?.length > 0 ? (
                currentApplication.properties.some((property) => property === null) ? (
                  <p>No property details available for this application.</p>
                ) : (
                  <>
                    <div className="separator-ofu">Properties</div>
                    <ul>
                      {currentApplication.properties.map((property, index) => (
                        <li key={index}>
                          <p><strong>Address:</strong> {property.address || 'N/A'}</p>
                          <p><strong>Type:</strong> {property.type || 'N/A'}</p>
                          <p><strong>Description:</strong> {property.description || 'N/A'}</p>
                          <p><strong>Availability:</strong> {property.availability || 'N/A'}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                )
              ) : (
                currentApplication.membership_type === 'Travel Host' && (
                  <p>No property details available for this application.</p>
                )
              )}

              {/* Action Buttons */}
              {activeTab === 'Pending' && (
                <div className="action-buttons">
                  <button onClick={() => handleStatusChange(currentApplication.id, true)}>Accept</button>
                  <button onClick={() => handleStatusChange(currentApplication.id, false)}>Reject</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Applications;
