const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const fs = require('fs');
const path = require('path');

// Process webhook payload
router.post('/process', async (req, res) => {
  try {
    const payload = req.body;
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Handle different types of webhook payloads
    if (payload.entry && payload.entry.length > 0) {
      for (const entry of payload.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              // Process new messages
              for (const message of change.value.messages) {
                await processMessage(message);
              }
            }
            
            if (change.value && change.value.statuses) {
              // Process status updates
              for (const status of change.value.statuses) {
                await processStatusUpdate(status);
              }
            }
          }
        }
      }
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Process individual message
async function processMessage(message) {
  try {
    const messageData = {
      id: message.id,
      meta_msg_id: message.id,
      wa_id: message.from,
      from: message.from,
      to: message.to,
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      type: message.type,
      direction: 'inbound',
      status: 'sent',
      user_name: message.context?.from?.name || '',
      user_number: message.from
    };

    // Handle different message types
    if (message.type === 'text' && message.text) {
      messageData.text = { body: message.text.body };
    } else if (message.type === 'image' && message.image) {
      messageData.image = message.image;
    } else if (message.type === 'video' && message.video) {
      messageData.video = message.video;
    } else if (message.type === 'audio' && message.audio) {
      messageData.audio = message.audio;
    } else if (message.type === 'document' && message.document) {
      messageData.document = message.document;
    }

    // Check if message already exists
    const existingMessage = await Message.findOne({ id: message.id });
    if (!existingMessage) {
      const newMessage = new Message(messageData);
      await newMessage.save();
      
      // Emit real-time update
      const io = require('../index').io;
      if (io) {
        io.to(message.from).emit('new-message', newMessage);
      }
      
      console.log('New message saved:', message.id);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

// Process status update
async function processStatusUpdate(status) {
  try {
    const messageId = status.id;
    const newStatus = status.status;

    const message = await Message.findOneAndUpdate(
      { $or: [{ id: messageId }, { meta_msg_id: messageId }] },
      { status: newStatus },
      { new: true }
    );

    if (message) {
      // Emit real-time update
      const io = require('../index').io;
      if (io) {
        io.to(message.wa_id).emit('message-status-updated', {
          messageId,
          status: newStatus,
          wa_id: message.wa_id
        });
      }
      
      console.log(`Message status updated: ${messageId} -> ${newStatus}`);
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

// Process sample payloads from files
router.post('/process-samples', async (req, res) => {
  try {
    const samplesDir = path.join(__dirname, '../samples');
    
    if (!fs.existsSync(samplesDir)) {
      return res.status(404).json({ error: 'Samples directory not found' });
    }

    const files = fs.readdirSync(samplesDir).filter(file => file.endsWith('.json'));
    let processedCount = 0;

    for (const file of files) {
      try {
        const filePath = path.join(samplesDir, file);
        const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Process the payload
        if (payload.entry && payload.entry.length > 0) {
          for (const entry of payload.entry) {
            if (entry.changes && entry.changes.length > 0) {
              for (const change of entry.changes) {
                if (change.value && change.value.messages) {
                  for (const message of change.value.messages) {
                    await processMessage(message);
                    processedCount++;
                  }
                }
                
                if (change.value && change.value.statuses) {
                  for (const status of change.value.statuses) {
                    await processStatusUpdate(status);
                    processedCount++;
                  }
                }
              }
            }
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    }

    res.json({ 
      success: true, 
      message: `Processed ${processedCount} items from sample files` 
    });
  } catch (error) {
    console.error('Error processing sample files:', error);
    res.status(500).json({ error: 'Failed to process sample files' });
  }
});

module.exports = router; 