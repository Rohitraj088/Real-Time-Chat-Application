import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import MessageList from '../MessageList/MessageList';
import MessageInput from '../MessageInput/MessageInput';
import RoomInfo from '../RoomInfo/RoomInfo';
import { FiMenu, FiMoreVertical, FiPhone, FiVideo, FiUsers } from 'react-icons/fi';
import './ChatWindow.css';

const ChatWindow = ({ onMenuClick }) => {
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user } = useAuth();
  const { activeRoom, messages, messagesLoading, getTypingUsersForRoom } = useChat();
  const { isUserOnline, startTyping, stopTyping, sendMessage } = useSocket();

  const typingUsers = getTypingUsersForRoom(activeRoom?._id);

  const getRoomDisplayInfo = useCallback(() => {
    if (!activeRoom) return { name: '', avatar: null, isOnline: false };
    
    if (activeRoom.type === 'private') {
      const otherUser = activeRoom.members?.find(m => m._id !== user._id);
      return {
        name: otherUser?.username || 'Unknown User',
        avatar: otherUser?.avatar,
        isOnline: isUserOnline(otherUser?._id),
        status: otherUser?.status
      };
    }
    
    return {
      name: activeRoom.name,
      avatar: activeRoom.avatar,
      isOnline: false,
      isGroup: true,
      memberCount: activeRoom.members?.length || 0
    };
  }, [activeRoom, user, isUserOnline]);

  const roomInfo = getRoomDisplayInfo();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content, type = 'text', attachment = null) => {
    if (activeRoom) {
      sendMessage(activeRoom._id, content, type, attachment);
    }
  };

  const handleTyping = (isTyping) => {
    if (activeRoom) {
      if (isTyping) {
        startTyping(activeRoom._id);
      } else {
        stopTyping(activeRoom._id);
      }
    }
  };

  if (!activeRoom) {
    return null;
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="menu-button mobile-only" onClick={onMenuClick}>
          <FiMenu />
        </button>

        <div className="chat-header-info" onClick={() => setShowRoomInfo(true)}>
          <div className="chat-avatar">
            {roomInfo.avatar ? (
              <img src={roomInfo.avatar} alt={roomInfo.name} />
            ) : roomInfo.isGroup ? (
              <div className="group-avatar">
                <FiUsers />
              </div>
            ) : (
              <span>{roomInfo.name.charAt(0).toUpperCase()}</span>
            )}
            {!roomInfo.isGroup && (
              <span className={`status-dot ${roomInfo.isOnline ? 'online' : 'offline'}`} />
            )}
          </div>
          <div className="chat-details">
            <h3>{roomInfo.name}</h3>
            <span className="chat-status">
              {typingUsers.length > 0 ? (
                <span className="typing-indicator">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              ) : roomInfo.isGroup ? (
                `${roomInfo.memberCount} members`
              ) : roomInfo.isOnline ? (
                'Online'
              ) : (
                'Offline'
              )}
            </span>
          </div>
        </div>

        <div className="chat-actions">
          <button className="action-button desktop-only" title="Voice call">
            <FiPhone />
          </button>
          <button className="action-button desktop-only" title="Video call">
            <FiVideo />
          </button>
          <button 
            className="action-button" 
            onClick={() => setShowRoomInfo(true)}
            title="Chat info"
          >
            <FiMoreVertical />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messagesLoading ? (
          <div className="messages-loading">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput 
        onSend={handleSendMessage}
        onTyping={handleTyping}
        roomId={activeRoom._id}
      />

      {/* Room Info Sidebar */}
      {showRoomInfo && (
        <RoomInfo 
          room={activeRoom} 
          onClose={() => setShowRoomInfo(false)} 
        />
      )}
    </div>
  );
};

export default ChatWindow;
