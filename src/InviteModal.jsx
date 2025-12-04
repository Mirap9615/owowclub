import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './InviteModal.css'; // Import the new stylesheet

const InviteModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        console.log(data)

        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = user.name ? user.name.toLowerCase().includes(searchLower) : false;
    const emailMatch = user.email.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  const handleSendInvites = async () => {
    setLoading(true);
    try {
      console.log('Sending invites for users:', selectedUsers);
      const response = await fetch('/api/events/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: Number(eventId),
          eventTitle,
          userIds: selectedUsers.map(id => Number(id))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to send invites');
      }

      const data = await response.json();
      console.log('Invite response:', data);
      onClose();
    } catch (error) {
      console.error('Error sending invites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="invite-modal" onClick={e => e.stopPropagation()}>
        <div className="invite-modal-header">
          <h2>Invite Members</h2>
          <button className="invite-close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="invite-modal-body">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="invite-search-input"
          />
          <div className="invite-users-list">
            {filteredUsers.map(user => (
              <div key={user.user_id} className="invite-user-item">
                <label className="invite-user-label">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.user_id)}
                    onChange={() => handleUserSelect(user.user_id)}
                  />
                  <div className="invite-user-info">
                    <span className="invite-user-name">{user.name || user.email}</span>
                    <span className="invite-user-email">{user.email}</span>
                    <span className="invite-user-type">{user.type}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="invite-modal-footer">
          <button
            className="invite-submit-button"
            onClick={handleSendInvites}
            disabled={loading || selectedUsers.length === 0}
          >
            {loading ? 'Sending...' : `Invite Selected (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InviteModal;