import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { roomsAPI } from '../../services/api';
import { format } from 'date-fns';
import { FiX, FiUsers, FiLogOut, FiTrash2, FiUserPlus, FiEdit2 } from 'react-icons/fi';
import './RoomInfo.css';

const RoomInfo = ({ room, onClose }) => {
  const [showAddMembers, setShowAddMembers] = useState(false);
  
  const { user } = useAuth();
  const { fetchRooms, setActiveRoom, setMessages } = useChat();
  const { isUserOnline } = useSocket();

  const isGroup = room.type === 'group';
  const isAdmin = room.admins?.some(a => a._id === user._id || a === user._id);
  const isCreator = room.createdBy?._id === user._id || room.createdBy === user._id;

  const getOtherUser = () => {
    if (!isGroup) {
      return room.members?.find(m => m._id !== user._id);
    }
    return null;
  };

  const otherUser = getOtherUser();

  const handleLeaveRoom = async () => {
    if (!window.confirm('Are you sure you want to leave this room?')) return;

    try {
      await roomsAPI.removeMember(room._id, user._id);
      setActiveRoom(null);
      setMessages([]);
      fetchRooms();
      onClose();
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleDeleteRoom = async () => {
    const message = isGroup 
      ? 'Are you sure you want to delete this group? This action cannot be undone.'
      : 'Are you sure you want to delete this chat? All messages will be permanently deleted.';
    
    if (!window.confirm(message)) return;

    try {
      await roomsAPI.deleteRoom(room._id);
      setActiveRoom(null);
      setMessages([]);
      fetchRooms();
      onClose();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  return (
    <>
      <div className="room-info-overlay" onClick={onClose} />
      <div className="room-info-panel">
        <div className="room-info-header">
          <h2>{isGroup ? 'Group Info' : 'Chat Info'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="room-info-content">
          {/* Avatar Section */}
          <div className="info-avatar-section">
            <div className="info-avatar">
              {(isGroup ? room.avatar : otherUser?.avatar) ? (
                <img 
                  src={isGroup ? room.avatar : otherUser?.avatar} 
                  alt={isGroup ? room.name : otherUser?.username} 
                />
              ) : isGroup ? (
                <FiUsers />
              ) : (
                <span>
                  {(isGroup ? room.name : otherUser?.username)?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3>{isGroup ? room.name : otherUser?.username}</h3>
            {!isGroup && (
              <span className={`user-status ${isUserOnline(otherUser?._id) ? 'online' : 'offline'}`}>
                {isUserOnline(otherUser?._id) ? 'Online' : 'Offline'}
              </span>
            )}
            {isGroup && room.description && (
              <p className="room-description">{room.description}</p>
            )}
          </div>

          {/* Info Section */}
          <div className="info-section">
            <h4>Details</h4>
            {!isGroup && otherUser?.email && (
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{otherUser.email}</span>
              </div>
            )}
            {!isGroup && otherUser?.bio && (
              <div className="info-item">
                <span className="info-label">Bio</span>
                <span className="info-value">{otherUser.bio}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Created</span>
              <span className="info-value">
                {format(new Date(room.createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Members Section (Group only) */}
          {isGroup && (
            <div className="info-section">
              <div className="section-header">
                <h4>Members ({room.members?.length})</h4>
                {isAdmin && (
                  <button 
                    className="add-member-btn"
                    onClick={() => setShowAddMembers(true)}
                  >
                    <FiUserPlus />
                    Add
                  </button>
                )}
              </div>
              <div className="members-list">
                {room.members?.map(member => (
                  <div key={member._id} className="member-item">
                    <div className="member-avatar">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.username} />
                      ) : (
                        <span>{member.username?.charAt(0).toUpperCase()}</span>
                      )}
                      <span className={`status-dot ${isUserOnline(member._id) ? 'online' : 'offline'}`} />
                    </div>
                    <div className="member-info">
                      <span className="member-name">
                        {member.username}
                        {member._id === user._id && ' (You)'}
                      </span>
                      {room.admins?.some(a => a._id === member._id || a === member._id) && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="info-actions">
            {isGroup && (
              <button className="action-btn leave" onClick={handleLeaveRoom}>
                <FiLogOut />
                Leave Group
              </button>
            )}
            {isGroup && isCreator && (
              <button className="action-btn delete" onClick={handleDeleteRoom}>
                <FiTrash2 />
                Delete Group
              </button>
            )}
            {!isGroup && (
              <button className="action-btn delete" onClick={handleDeleteRoom}>
                <FiTrash2 />
                Delete Chat
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomInfo;
