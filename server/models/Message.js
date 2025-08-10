const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  meta_msg_id: {
    type: String,
    required: true
  },
  wa_id: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document'],
    default: 'text'
  },
  text: {
    body: String
  },
  image: {
    id: String,
    mime_type: String,
    sha256: String
  },
  video: {
    id: String,
    mime_type: String,
    sha256: String
  },
  audio: {
    id: String,
    mime_type: String,
    sha256: String
  },
  document: {
    id: String,
    filename: String,
    mime_type: String,
    sha256: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: null
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  user_name: {
    type: String,
    default: ''
  },
  user_number: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ meta_msg_id: 1 });

// Use the 'processed_messages' collection to align with webhook processing task
module.exports = mongoose.model('Message', messageSchema, 'processed_messages');