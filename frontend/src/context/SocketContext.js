import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('room:join', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('room:leave', roomId);
    }
  };

  const sendMessage = (roomId, content, type = 'text', attachment = null) => {
    if (socket) {
      socket.emit('message:send', { roomId, content, type, attachment });
    }
  };

  const startTyping = (roomId) => {
    if (socket) {
      socket.emit('typing:start', roomId);
    }
  };

  const stopTyping = (roomId) => {
    if (socket) {
      socket.emit('typing:stop', roomId);
    }
  };

  const markAsRead = (messageId, roomId) => {
    if (socket) {
      socket.emit('message:read', { messageId, roomId });
    }
  };

  const editMessage = (messageId, content) => {
    if (socket) {
      socket.emit('message:edit', { messageId, content });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit('message:delete', { messageId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    editMessage,
    deleteMessage,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
