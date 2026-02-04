import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI } from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { FiFile, FiDownload, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import './MessageList.css';

const MessageList = ({ messages, onMessageDeleted }) => {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState(null);

  const formatMessageTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const formatDateSeparator = (date) => {
    const msgDate = new Date(date);
    if (isToday(msgDate)) return 'Today';
    if (isYesterday(msgDate)) return 'Yesterday';
    return format(msgDate, 'MMMM d, yyyy');
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const isOwnMessage = (message) => {
    return message.sender?._id === user._id;
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    
    try {
      await messagesAPI.deleteMessage(messageId);
      setActiveMenu(null);
      if (onMessageDeleted) {
        onMessageDeleted(messageId);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const toggleMenu = (messageId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === messageId ? null : messageId);
  };

  const renderAttachment = (message) => {
    if (!message.attachment) return null;

    const { mimetype, url, originalName, size } = message.attachment;

    if (mimetype?.startsWith('image/')) {
      return (
        <div className="message-image">
          <img src={url} alt="Shared" loading="lazy" />
        </div>
      );
    }

    return (
      <a href={url} download={originalName} className="message-file" target="_blank" rel="noopener noreferrer">
        <div className="file-icon">
          <FiFile />
        </div>
        <div className="file-info">
          <span className="file-name">{originalName}</span>
          <span className="file-size">{formatFileSize(size)}</span>
        </div>
        <FiDownload className="download-icon" />
      </a>
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (messages.length === 0) {
    return (
      <div className="messages-empty">
        <p>No messages yet</p>
        <span>Start the conversation!</span>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
        const isOwn = isOwnMessage(message);

        return (
          <React.Fragment key={message._id}>
            {showDateSeparator && (
              <div className="date-separator">
                <span>{formatDateSeparator(message.createdAt)}</span>
              </div>
            )}

            {message.type === 'system' ? (
              <div className="system-message">
                <span>{message.content}</span>
              </div>
            ) : (
              <div className={`message ${isOwn ? 'own' : 'other'} ${message.deleted ? 'deleted' : ''}`}>
                {!isOwn && (
                  <div className="message-avatar">
                    {message.sender?.avatar ? (
                      <img src={message.sender.avatar} alt={message.sender.username} />
                    ) : (
                      <span>{message.sender?.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                )}
                
                <div className="message-content">
                  <div className="message-wrapper">
                    {!isOwn && (
                      <span className="message-sender">{message.sender?.username}</span>
                    )}
                    
                    <div className="message-bubble">
                      {message.type === 'image' || message.type === 'file' ? (
                        renderAttachment(message)
                      ) : null}
                      
                      {message.content && (
                        <p className="message-text">{message.content}</p>
                      )}
                      
                      <div className="message-meta">
                        <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                        {message.edited && <span className="edited-label">edited</span>}
                      </div>
                    </div>
                  </div>

                  {/* Delete option for own messages */}
                  {isOwn && !message.deleted && (
                    <div className="message-actions">
                      <button 
                        className="message-menu-btn"
                        onClick={(e) => toggleMenu(message._id, e)}
                      >
                        <FiMoreVertical />
                      </button>
                      {activeMenu === message._id && (
                        <div className="message-menu">
                          <button 
                            className="menu-item delete"
                            onClick={() => handleDeleteMessage(message._id)}
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;