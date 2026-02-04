import React, { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/ChatWindow/ChatWindow';
import WelcomeScreen from '../components/WelcomeScreen/WelcomeScreen';
import { useChat } from '../context/ChatContext';
import './Chat.css';

const Chat = () => {
  const { activeRoom } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="chat-page">
      <Sidebar 
        isVisible={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
      
      <div className="chat-main">
        {activeRoom ? (
          <ChatWindow onMenuClick={toggleSidebar} />
        ) : (
          <WelcomeScreen onStartChat={() => setShowSidebar(true)} />
        )}
      </div>

      {/* Mobile overlay */}
      {showSidebar && (
        <div 
          className="sidebar-overlay mobile-only"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
};

export default Chat;
