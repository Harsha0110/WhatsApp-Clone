const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { v4: uuidv4 } = require('uuid');

// Get all conversations (grouped by wa_id)
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $group: {
          _id: '$wa_id',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          user_name: { $first: '$user_name' },
          user_number: { $first: '$user_number' }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const messages = await Message.find({ wa_id })
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message (demo functionality)
router.post('/send', async (req, res) => {
  try {
    const { wa_id, text, user_name, user_number } = req.body;
    
    if (!wa_id || !text) {
      return res.status(400).json({ error: 'wa_id and text are required' });
    }

    const newMessage = new Message({
      id: uuidv4(),
      meta_msg_id: uuidv4(),
      wa_id,
      from: 'user', // Demo user
      to: wa_id,
      type: 'text',
      text: { body: text },
      direction: 'outbound',
      status: 'sent',
      user_name: user_name || 'Demo User',
      user_number: user_number || wa_id,
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(wa_id).emit('new-message', savedMessage);

    res.json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update message status
router.put('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findOneAndUpdate(
      { $or: [{ id: messageId }, { meta_msg_id: messageId }] },
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(message.wa_id).emit('message-status-updated', {
      messageId,
      status,
      wa_id: message.wa_id
    });

    res.json(message);
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Get all messages (for admin/debug purposes)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router; 