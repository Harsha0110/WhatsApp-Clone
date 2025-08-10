/*
  Standalone processor for WhatsApp webhook sample payloads.
  - Reads JSON files from server/WhatsApp samples payload
  - Inserts message payloads into MongoDB (db: whatsapp, collection: processed_messages via Message model)
  - Applies status updates (sent/delivered/read) by id or meta_msg_id
*/

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BaseMessageModel = require('../models/Message');
// Reuse the existing schema, but bind to the processed_messages collection for this script
const ProcessedMessage = mongoose.model('ProcessedMessage', BaseMessageModel.schema, 'processed_messages');

// Mongo connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp';


async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'whatsapp' });
}

function unixSecondsToDate(unixSeconds) {
  if (!unixSeconds) return new Date();
  const numeric = Number(unixSeconds);
  if (Number.isNaN(numeric)) return new Date();
  // Most webhook timestamps are seconds
  return new Date(numeric * 1000);
}

function inferDirectionAndParties(message, valueEnvelope) {
  const businessWa = valueEnvelope?.metadata?.display_phone_number || valueEnvelope?.metadata?.phone_number_id;
  const contactWa = Array.isArray(valueEnvelope?.contacts) && valueEnvelope.contacts.length > 0
    ? valueEnvelope.contacts[0].wa_id
    : undefined;

  const messageFrom = message.from;
  // If from is the business number, it's outbound; else inbound
  const isOutbound = businessWa && messageFrom && messageFrom === String(businessWa);

  const userWa = contactWa || (!isOutbound ? messageFrom : undefined);

  if (isOutbound) {
    return {
      direction: 'outbound',
      wa_id: userWa || message.to || message.recipient_id || '',
      from: businessWa || messageFrom,
      to: userWa || message.to || message.recipient_id || contactWa || '',
    };
  }

  return {
    direction: 'inbound',
    wa_id: userWa || messageFrom || '',
    from: messageFrom || userWa || '',
    to: businessWa || message.to || '',
  };
}

async function processMessage(message, valueEnvelope) {
  const { direction, wa_id, from, to } = inferDirectionAndParties(message, valueEnvelope);

  const messageData = {
    id: message.id,
    meta_msg_id: message.id,
    wa_id,
    from,
    to,
    timestamp: unixSecondsToDate(message.timestamp),
    type: message.type || 'text',
    direction,
    status: 'sent',
    user_name: valueEnvelope?.contacts?.[0]?.profile?.name || '',
    user_number: wa_id || '',
  };

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

  // Basic validation to satisfy required fields in schema
  if (!messageData.id || !messageData.meta_msg_id || !messageData.wa_id || !messageData.from || !messageData.to) {
    console.warn('Skipping message due to missing required fields:', { id: messageData.id, wa_id: messageData.wa_id, from: messageData.from, to: messageData.to });
    return;
  }

  const existing = await ProcessedMessage.findOne({ id: messageData.id });
  if (existing) return { saved: false, duplicate: true };

  const saved = await new ProcessedMessage(messageData).save();
  console.log('Saved message:', saved.id, saved.direction, '->', saved.status);
  return { saved: true, duplicate: false };
}

async function processStatusUpdate(status) {
  const messageId = status.id || status.meta_msg_id;
  const newStatus = status.status;
  if (!messageId || !newStatus) return { updated: false, unknown: true };

  const updated = await ProcessedMessage.findOneAndUpdate(
    { $or: [{ id: messageId }, { meta_msg_id: messageId }] },
    { status: newStatus },
    { new: true }
  );

  if (updated) {
    console.log(`Updated status: ${messageId} -> ${newStatus}`);
    return { updated: true, unknown: false };
  } else {
    console.warn(`Status refers to unknown messageId: ${messageId}`);
    return { updated: false, unknown: true };
  }
}

async function processPayloadObject(payload) {
  // Support both real webhook shape { entry: [...] } and sample shape { metaData: { entry: [...] } }
  const entryArray = payload?.entry || payload?.metaData?.entry;
  if (!Array.isArray(entryArray)) return 0;

  let processed = 0;
  let insertedMessages = 0;
  let skippedDuplicates = 0;
  let updatedStatuses = 0;
  let statusUnknownRefs = 0;
  for (const entry of entryArray) {
    if (!Array.isArray(entry?.changes)) continue;
    for (const change of entry.changes) {
      const value = change?.value || {};
      if (Array.isArray(value.messages)) {
        for (const msg of value.messages) {
          const result = await processMessage(msg, value);
          if (result?.saved) insertedMessages += 1;
          if (result?.duplicate) skippedDuplicates += 1;
          processed += 1;
        }
      }
      if (Array.isArray(value.statuses)) {
        for (const st of value.statuses) {
          const result = await processStatusUpdate(st);
          if (result?.updated) updatedStatuses += 1;
          if (result?.unknown) statusUnknownRefs += 1;
          processed += 1;
        }
      }
    }
  }
  return { processed, insertedMessages, skippedDuplicates, updatedStatuses, statusUnknownRefs };
}

async function main() {
  const samplesDir = path.join(__dirname, '../WhatsApp samples payload');
  if (!fs.existsSync(samplesDir)) {
    console.error('Samples directory not found:', samplesDir);
    process.exit(1);
  }

  await connectMongo();
  console.log('Connected to MongoDB at', mongoUri);

  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No JSON files found in', samplesDir);
    process.exit(0);
  }

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalDupes = 0;
  let totalUpdated = 0;
  let totalUnknown = 0;
  for (const file of files) {
    const filePath = path.join(samplesDir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      const stats = await processPayloadObject(json);
      totalProcessed += stats.processed;
      totalInserted += stats.insertedMessages;
      totalDupes += stats.skippedDuplicates;
      totalUpdated += stats.updatedStatuses;
      totalUnknown += stats.statusUnknownRefs;
      console.log(`Processed ${stats.processed} items from ${file} (inserted: ${stats.insertedMessages}, duplicates: ${stats.skippedDuplicates}, status updated: ${stats.updatedStatuses}, status unknown: ${stats.statusUnknownRefs})`);
    } catch (err) {
      console.error('Error processing file', file, err.message);
    }
  }

  console.log(`Done. Total processed items: ${totalProcessed}. Inserted: ${totalInserted}, Duplicates: ${totalDupes}, Status updated: ${totalUpdated}, Status unknown: ${totalUnknown}`);
  await mongoose.connection.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


