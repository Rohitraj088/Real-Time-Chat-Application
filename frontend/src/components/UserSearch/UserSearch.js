import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import './UserSearch.css';

const UserSearch = ({ onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { startPrivateChat, selectRoom } = useChat();
  const { isUserOnline } = useSocket();

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

  const handleStartChat = async (userId) => {
    try {
      const room = await startPrivateChat(userId);
      await selectRoom(room);
      onUserSelect?.();
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="user-search">
      <div className="search-input-wrapper">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search users by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="user-list">
        {loading ? (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        ) : users.length > 0 ? (
          users.map(user => (
            <div key={user._id} className="user-item">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <span>{user.username.charAt(0).toUpperCase()}</span>
                )}
                <span className={`status-indicator ${isUserOnline(user._id) ? 'online' : 'offline'}`} />
              </div>
              <div className="user-info">
                <h4>{user.username}</h4>
                <p>{user.email}</p>
              </div>
              <button 
                className="start-chat-btn"
                onClick={() => handleStartChat(user._id)}
                title="Start conversation"
              >
                <FiUserPlus />
              </button>
            </div>
          ))
        ) : searchQuery ? (
          <div className="no-results">
            <p>No users found</p>
            <span>Try a different search term</span>
          </div>
        ) : (
          <div className="search-hint">
            <FiSearch className="hint-icon" />
            <p>Search for users</p>
            <span>Enter a username or email to find users</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
