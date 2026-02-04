import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import RoomList from '../RoomList/RoomList';
import UserSearch from '../UserSearch/UserSearch';
import CreateRoomModal from '../CreateRoomModal/CreateRoomModal';
import ProfileModal from '../ProfileModal/ProfileModal';
import { FiPlus, FiSearch, FiSettings, FiLogOut, FiUsers, FiMessageSquare } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, logout } = useAuth();
  const { rooms } = useChat();
  const { isConnected } = useSocket();

  const handleLogout = async () => {
    await logout();
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    
    if (room.type === 'private') {
      const otherUser = room.members.find(m => m._id !== user._id);
      return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return room.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <aside className={`sidebar ${isVisible ? 'visible' : ''}`}>
        {/* User Header */}
        <div className="sidebar-header">
          <div className="user-info" onClick={() => setShowProfile(true)}>
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <span>{user?.username?.charAt(0).toUpperCase()}</span>
              )}
              <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            </div>
            <div className="user-details">
              <h3>{user?.username}</h3>
              <span className="status-text">
                {isConnected ? 'Online' : 'Connecting...'}
              </span>
            </div>
          </div>
          <button 
            className="icon-button"
            onClick={() => setShowCreateRoom(true)}
            title="Create new chat"
          >
            <FiPlus />
          </button>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="sidebar-tabs">
          <button 
            className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <FiMessageSquare />
            <span>Chats</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers />
            <span>Users</span>
          </button>
        </div>

        {/* Content */}
        <div className="sidebar-content">
          {activeTab === 'chats' ? (
            <RoomList rooms={filteredRooms} onRoomSelect={onClose} />
          ) : (
            <UserSearch onUserSelect={onClose} />
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button 
            className="footer-button"
            onClick={() => setShowProfile(true)}
          >
            <FiSettings />
            <span>Settings</span>
          </button>
          <button 
            className="footer-button logout"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
      
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </>
  );
};

export default Sidebar;
