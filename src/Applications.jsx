import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkAuth from './CheckAuth.jsx';
import Steamed from './Steamed.jsx';
import './applications.css';

const Applications = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState([]);
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

  if (loading) {
    return <p>Loading applications...</p>;
  }

  return (
    <>
      <Steamed />
      <div className="applications-container">
        <h1>Membership Applications</h1>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === 'Pending' ? 'active' : ''}
            onClick={() => setActiveTab('Pending')}
          >
            Pending
          </button>
          <button
              className={activeTab === 'All' ? 'active' : ''}
              onClick={() => setActiveTab('All')}
            >
              All
          </button>
          <button
            className={activeTab === 'Accepted' ? 'active' : ''}
            onClick={() => setActiveTab('Accepted')}
          >
            Accepted
          </button>
          <button
            className={activeTab === 'Rejected' ? 'active' : ''}
            onClick={() => setActiveTab('Rejected')}
          >
            Rejected
          </button>
        </div>

        {/* Table or Message */}

        {filteredApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            No applications of this type
          </div>
        ) : (
          <table className="applications-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Submitted</th>
              <th>Interests</th>
              <th>Status</th>
              {activeTab === 'Pending' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((app, index) => (
              <React.Fragment key={app.id}>
                <tr className="application-row">
                  <td>{app.full_name}</td>
                  <td>{app.email}</td>
                  <td>{app.phone}</td>
                  <td>{new Date(app.created_at).toLocaleDateString()}</td>
                  <td>
                    {Array.isArray(app.interests)
                      ? app.interests.join(', ')
                      : app.interests}
                  </td>
                  <td>{app.accepted === null ? 'Pending' : app.accepted ? 'Accepted' : 'Rejected'}</td>

                  {/* Actions for Pending Tab */}
                  {activeTab === 'Pending' && (
                    <td>
                      <button
                        onClick={() => handleStatusChange(app.id, true)}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, false)}
                      >
                        Reject
                      </button>
                    </td>
                  )}
                </tr>
                <tr className="application-detail-row">
                  <td colSpan="8">
                    <strong>Reason:</strong> {app.reason}
                  </td>
                </tr>
                <tr className="application-detail-row">
                  <td colSpan="8">
                    <strong>Referral:</strong> {app.referral}
                  </td>
                </tr>
                <tr className="application-detail-row">
                  <td colSpan="8">
                    <strong>Comments:</strong> {app.comments}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        )}

      </div>
    </>
  );
};

export default Applications;
