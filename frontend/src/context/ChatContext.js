import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { roomsAPI, messagesAPI } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const { socket, joinRoom, leaveRoom } = useSocket();
  const { user } = useAuth();

  // Fetch user's rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await roomsAPI.getRooms();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a room
  const fetchMessages = useCallback(async (roomId, page = 1) => {
    try {
      setMessagesLoading(true);
      const response = await messagesAPI.getMessages(roomId, page);
      setMessages(response.data.messages);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return null;
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Select a room
  const selectRoom = useCallback(async (room) => {
    if (activeRoom?._id === room._id) return;

    // Leave previous room
    if (activeRoom) {
      leaveRoom(activeRoom._id);
    }

    // Join new room
    joinRoom(room._id);
    setActiveRoom(room);
    
    // Fetch messages
    await fetchMessages(room._id);

    // Clear unread count
    setUnreadCounts(prev => ({ ...prev, [room._id]: 0 }));
  }, [activeRoom, joinRoom, leaveRoom, fetchMessages]);

  // Create a new group room
  const createRoom = async (name, description, members) => {
    try {
      const response = await roomsAPI.createRoom({ name, description, members, type: 'group' });
      setRooms(prev => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  // Start a private conversation
  const startPrivateChat = async (userId) => {
    try {
      const response = await roomsAPI.createPrivateRoom(userId);
      const existingRoom = rooms.find(r => r._id === response.data._id);
      
      if (!existingRoom) {
        setRooms(prev => [response.data, ...prev]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating private chat:', error);
      throw error;
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // New message received
    const handleNewMessage = (message) => {
      if (activeRoom?._id === message.room) {
        setMessages(prev => [...prev, message]);
      } else {
        // Update unread count
        setUnreadCounts(prev => ({
          ...prev,
          [message.room]: (prev[message.room] || 0) + 1
        }));
      }

      // Update room's last message
      setRooms(prev => prev.map(room => 
        room._id === message.room 
          ? { ...room, lastMessage: message, lastActivity: new Date() }
          : room
      ).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)));
    };

    // Message updated
    const handleMessageUpdated = (message) => {
      setMessages(prev => prev.map(m => 
        m._id === message._id ? message : m
      ));
    };

    // Message deleted
    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, deleted: true, content: 'This message was deleted' } : m
      ));
    };

    // Typing indicators
    const handleTypingStart = ({ userId, username, roomId }) => {
      if (userId !== user._id) {
        setTypingUsers(prev => ({
          ...prev,
          [roomId]: { ...prev[roomId], [userId]: username }
        }));
      }
    };

    const handleTypingStop = ({ userId, roomId }) => {
      setTypingUsers(prev => {
        const roomTyping = { ...prev[roomId] };
        delete roomTyping[userId];
        return { ...prev, [roomId]: roomTyping };
      });
    };

    // Room events
    const handleNewRoom = (room) => {
      setRooms(prev => {
        if (prev.find(r => r._id === room._id)) return prev;
        return [room, ...prev];
      });
    };

    const handleRoomUpdated = (room) => {
      setRooms(prev => prev.map(r => r._id === room._id ? room : r));
      if (activeRoom?._id === room._id) {
        setActiveRoom(room);
      }
    };

    const handleRoomDeleted = (roomId) => {
      setRooms(prev => prev.filter(r => r._id !== roomId));
      if (activeRoom?._id === roomId) {
        setActiveRoom(null);
        setMessages([]);
      }
    };

    // Register listeners
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleMessageUpdated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('room:new', handleNewRoom);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:deleted', handleRoomDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('room:new', handleNewRoom);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:deleted', handleRoomDeleted);
    };
  }, [socket, user, activeRoom]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Get typing users for current room
  const getTypingUsersForRoom = (roomId) => {
    const typing = typingUsers[roomId] || {};
    return Object.values(typing);
  };

  const value = {
    rooms,
    activeRoom,
    messages,
    loading,
    messagesLoading,
    unreadCounts,
    fetchRooms,
    fetchMessages,
    selectRoom,
    createRoom,
    startPrivateChat,
    setActiveRoom,
    setMessages,
    getTypingUsersForRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
