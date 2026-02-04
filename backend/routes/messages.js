const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages/:roomId
// @desc    Get messages for a room
// @access  Private
router.get('/:roomId', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member
    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ 
      room: req.params.roomId,
      deleted: false 
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ 
      room: req.params.roomId,
      deleted: false 
    });

    res.json({
      messages: messages.reverse(),
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/messages/:roomId
// @desc    Send a message (REST endpoint, Socket is preferred)
// @access  Private
router.post('/:roomId', protect, async (req, res) => {
  try {
    const { content, type = 'text', attachment } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await Message.create({
      room: req.params.roomId,
      sender: req.user._id,
      content,
      type,
      attachment,
      readBy: [{ user: req.user._id }]
    });

    // Update room's last message and activity
    room.lastMessage = message._id;
    room.lastActivity = Date.now();
    await room.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar');

    // Emit via socket
    const io = req.app.get('io');
    io.to(req.params.roomId).emit('message:new', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = Date.now();
    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar');

    // Emit via socket
    const io = req.app.get('io');
    io.to(message.room.toString()).emit('message:updated', updatedMessage);

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.deleted = true;
    message.content = 'This message was deleted';
    await message.save();

    // Emit via socket
    const io = req.app.get('io');
    io.to(message.room.toString()).emit('message:deleted', {
      messageId: message._id,
      roomId: message.room
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.post('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
