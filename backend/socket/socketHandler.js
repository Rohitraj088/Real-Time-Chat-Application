const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Room = require('../models/Room');

// Store online users: { odId: { odId, odId } }
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);

    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { status: 'online' });

    // Join user's personal room for direct notifications
    socket.join(socket.userId);

    // Join all user's rooms
    const userRooms = await Room.find({ members: socket.userId });
    userRooms.forEach(room => {
      socket.join(room._id.toString());
    });

    // Broadcast online status to all connected users
    io.emit('user:online', { userId: socket.userId });

    // Handle joining a room
    socket.on('room:join', async (roomId) => {
      socket.join(roomId);
      console.log(`${socket.user.username} joined room: ${roomId}`);
    });

    // Handle leaving a room
    socket.on('room:leave', (roomId) => {
      socket.leave(roomId);
      console.log(`${socket.user.username} left room: ${roomId}`);
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      try {
        const { roomId, content, type = 'text', attachment } = data;

        // Verify user is member of room
        const room = await Room.findById(roomId);
        if (!room || !room.members.includes(socket.userId)) {
          socket.emit('error', { message: 'Not authorized to send messages in this room' });
          return;
        }

        // Create message
        const message = await Message.create({
          room: roomId,
          sender: socket.userId,
          content,
          type,
          attachment,
          readBy: [{ user: socket.userId }]
        });

        // Update room's last message
        room.lastMessage = message._id;
        room.lastActivity = Date.now();
        await room.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar');

        // Emit to all users in the room
        io.to(roomId).emit('message:new', populatedMessage);

        // Send notification to offline room members
        room.members.forEach(memberId => {
          if (memberId.toString() !== socket.userId) {
            io.to(memberId.toString()).emit('notification:message', {
              roomId,
              message: populatedMessage
            });
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (roomId) => {
      socket.to(roomId).emit('typing:start', {
        userId: socket.userId,
        username: socket.user.username,
        roomId
      });
    });

    socket.on('typing:stop', (roomId) => {
      socket.to(roomId).emit('typing:stop', {
        userId: socket.userId,
        roomId
      });
    });

    // Handle message read
    socket.on('message:read', async (data) => {
      try {
        const { messageId, roomId } = data;

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: { user: socket.userId } }
        });

        socket.to(roomId).emit('message:read', {
          messageId,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle message edit
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await Message.findById(messageId);
        
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        message.content = content;
        message.edited = true;
        message.editedAt = Date.now();
        await message.save();

        const updatedMessage = await Message.findById(messageId)
          .populate('sender', 'username avatar');

        io.to(message.room.toString()).emit('message:updated', updatedMessage);
      } catch (error) {
        console.error('Error editing message:', error);
      }
    });

    // Handle message delete
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        message.deleted = true;
        message.content = 'This message was deleted';
        await message.save();

        io.to(message.room.toString()).emit('message:deleted', {
          messageId,
          roomId: message.room
        });
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      onlineUsers.delete(socket.userId);

      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: Date.now()
      });

      // Broadcast offline status
      io.emit('user:offline', { 
        userId: socket.userId,
        lastSeen: Date.now()
      });
    });
  });
};

module.exports = socketHandler;
