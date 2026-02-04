import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';
import './CreateRoomModal.css';

const CreateRoomModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { createRoom, selectRoom } = useChat();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        const response = await usersAPI.getUsers(searchQuery);
        setUsers(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreate = async () => {
    if (!roomName.trim() || selectedUsers.length === 0) return;

    try {
      setCreating(true);
      const memberIds = selectedUsers.map(u => u._id);
      const room = await createRoom(roomName, description, memberIds);
      await selectRoom(room);
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-room-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Group Chat</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  placeholder="What is this group about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
              </div>

              <button 
                className="next-btn"
                onClick={() => setStep(2)}
                disabled={!roomName.trim()}
              >
                Next: Add Members
              </button>
            </>
          ) : (
            <>
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="selected-users">
                  {selectedUsers.map(user => (
                    <div key={user._id} className="selected-user-chip">
                      <span>{user.username}</span>
                      <button onClick={() => toggleUserSelection(user)}>
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User List */}
              <div className="users-list">
                {loading ? (
                  <div className="loading">Searching...</div>
                ) : users.length > 0 ? (
                  users.map(user => {
                    const isSelected = selectedUsers.some(u => u._id === user._id);
                    return (
                      <div 
                        key={user._id} 
                        className={`user-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(user)}
                      >
                        <div className="user-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <span>{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="user-info">
                          <span className="username">{user.username}</span>
                          <span className="email">{user.email}</span>
                        </div>
                        {isSelected && (
                          <div className="check-icon">
                            <FiCheck />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : searchQuery ? (
                  <div className="no-results">No users found</div>
                ) : (
                  <div className="hint">Search for users to add to the group</div>
                )}
              </div>

              <div className="modal-actions">
                <button className="back-btn" onClick={() => setStep(1)}>
                  Back
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreate}
                  disabled={selectedUsers.length === 0 || creating}
                >
                  {creating ? 'Creating...' : `Create Group (${selectedUsers.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
