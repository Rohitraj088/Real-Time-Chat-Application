const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('members', 'username avatar status')
      .populate('lastMessage')
      .populate('createdBy', 'username')
      .sort({ lastActivity: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room (group chat)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, members, type } = req.body;

    // Ensure creator is included in members
    const memberIds = [...new Set([req.user._id.toString(), ...(members || [])])];

    const room = await Room.create({
      name,
      description,
      type: type || 'group',
      members: memberIds,
      admins: [req.user._id],
      createdBy: req.user._id
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('members', 'username avatar status')
      .populate('createdBy', 'username');

    // Notify members via socket
    const io = req.app.get('io');
    memberIds.forEach(memberId => {
      if (memberId !== req.user._id.toString()) {
        io.to(memberId).emit('room:new', populatedRoom);
      }
    });

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/rooms/private
// @desc    Create or get private chat room between two users
// @access  Private
router.post('/private', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if private room already exists
    let room = await Room.findOne({
      type: 'private',
      members: { $all: [req.user._id, userId], $size: 2 }
    })
      .populate('members', 'username avatar status')
      .populate('lastMessage');

    if (room) {
      return res.json(room);
    }

    // Create new private room
    room = await Room.create({
      type: 'private',
      members: [req.user._id, userId],
      createdBy: req.user._id
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('members', 'username avatar status');

    // Notify other user
    const io = req.app.get('io');
    io.to(userId).emit('room:new', populatedRoom);

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members', 'username avatar status email bio')
      .populate('admins', 'username')
      .populate('createdBy', 'username')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' }
      });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member
    if (!room.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room details
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is admin
    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Only admins can update room details' });
    }

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (avatar) room.avatar = avatar;

    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('members', 'username avatar status');

    // Notify all members
    const io = req.app.get('io');
    io.to(room._id.toString()).emit('room:updated', updatedRoom);

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/rooms/:id/members
// @desc    Add members to room
// @access  Private (Admin only)
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { members } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    // Add new members
    const newMembers = members.filter(m => !room.members.includes(m));
    room.members.push(...newMembers);
    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('members', 'username avatar status');

    // Notify all members
    const io = req.app.get('io');
    io.to(room._id.toString()).emit('room:updated', updatedRoom);
    
    // Notify new members
    newMembers.forEach(memberId => {
      io.to(memberId).emit('room:new', updatedRoom);
    });

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/rooms/:id/members/:userId
// @desc    Remove member from room
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isAdmin = room.admins.includes(req.user._id);
    const isSelf = req.params.userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    room.members = room.members.filter(m => m.toString() !== req.params.userId);
    room.admins = room.admins.filter(a => a.toString() !== req.params.userId);
    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('members', 'username avatar status');

    // Notify all members
    const io = req.app.get('io');
    io.to(room._id.toString()).emit('room:updated', updatedRoom);
    io.to(req.params.userId).emit('room:removed', room._id);

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (Creator for groups, any member for private chats)
router.delete('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check authorization
    const isMember = room.members.some(m => m.toString() === req.user._id.toString());
    const isCreator = room.createdBy.toString() === req.user._id.toString();

    // For private chats, any member can delete
    // For group chats, only creator can delete
    if (room.type === 'private') {
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to delete this chat' });
      }
    } else {
      if (!isCreator) {
        return res.status(403).json({ message: 'Only creator can delete group' });
      }
    }

    // Delete all messages in the room
    await Message.deleteMany({ room: room._id });
    
    // Notify all members
    const io = req.app.get('io');
    room.members.forEach(memberId => {
      io.to(memberId.toString()).emit('room:deleted', room._id);
    });

    await room.deleteOne();

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
