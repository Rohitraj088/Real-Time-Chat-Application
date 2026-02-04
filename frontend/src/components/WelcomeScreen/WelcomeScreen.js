import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMessageCircle, FiUsers, FiLock, FiZap } from 'react-icons/fi';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onStartChat }) => {
  const { user } = useAuth();

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <FiMessageCircle />
        </div>
        
        <h1>Welcome, {user?.username}!</h1>
        <p>Start chatting with friends, create groups, or find new people to connect with.</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiZap />
            </div>
            <h3>Real-time Messaging</h3>
            <p>Instant message delivery with typing indicators</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiUsers />
            </div>
            <h3>Group Chats</h3>
            <p>Create groups and chat with multiple people</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FiLock />
            </div>
            <h3>Private & Secure</h3>
            <p>Your conversations are always private</p>
          </div>
        </div>

        <button className="start-btn mobile-only" onClick={onStartChat}>
          Start Chatting
        </button>

        <div className="welcome-hint desktop-only">
          <p>Select a conversation from the sidebar to start chatting</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
