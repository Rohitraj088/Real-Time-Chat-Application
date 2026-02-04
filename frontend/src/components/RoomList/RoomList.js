import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { FiUsers } from 'react-icons/fi';
import './RoomList.css';

const RoomList = ({ rooms, onRoomSelect }) => {
  const { user } = useAuth();
  const { activeRoom, selectRoom, unreadCounts } = useChat();
  const { isUserOnline } = useSocket();

  const handleRoomClick = async (room) => {
    await selectRoom(room);
    onRoomSelect?.();
  };

  const getRoomDisplayInfo = (room) => {
    if (room.type === 'private') {
      const otherUser = room.members.find(m => m._id !== user._id);
      return {
        name: otherUser?.username || 'Unknown User',
        avatar: otherUser?.avatar,
        isOnline: isUserOnline(otherUser?._id)
      };
    }
    
    return {
      name: room.name,
      avatar: room.avatar,
      isOnline: false,
      isGroup: true
    };
  };

  const getLastMessagePreview = (room) => {
    if (!room.lastMessage) return 'No messages yet';
    
    const { lastMessage } = room;
    
    if (lastMessage.deleted) return 'Message deleted';
    if (lastMessage.type === 'image') return '📷 Image';
    if (lastMessage.type === 'file') return '📎 File';
    
    const content = lastMessage.content || '';
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: false });
  };

  if (rooms.length === 0) {
    return (
      <div className="room-list-empty">
        <FiUsers className="empty-icon" />
        <p>No conversations yet</p>
        <span>Start a new chat or create a group</span>
      </div>
    );
  }

  return (
    <div className="room-list">
      {rooms.map(room => {
        const { name, avatar, isOnline, isGroup } = getRoomDisplayInfo(room);
        const unreadCount = unreadCounts[room._id] || 0;
        const isActive = activeRoom?._id === room._id;

        return (
          <div
            key={room._id}
            className={`room-item ${isActive ? 'active' : ''}`}
            onClick={() => handleRoomClick(room)}
          >
            <div className="room-avatar">
              {avatar ? (
                <img src={avatar} alt={name} />
              ) : isGroup ? (
                <div className="group-avatar">
                  <FiUsers />
                </div>
              ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
              )}
              {!isGroup && (
                <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
              )}
            </div>

            <div className="room-info">
              <div className="room-header">
                <h4 className="room-name">{name}</h4>
                <span className="room-time">
                  {getTimeAgo(room.lastActivity || room.createdAt)}
                </span>
              </div>
              <div className="room-preview">
                <p className="last-message">{getLastMessagePreview(room)}</p>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomList;
