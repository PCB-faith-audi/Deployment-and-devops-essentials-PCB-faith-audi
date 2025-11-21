const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    room: {
      type: String,
      default: 'general',
    },
    fileName: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: null,
    },
    isFile: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    recipient: {
      type: String,
      default: null,
    },
    delivered: {
      type: Boolean,
      default: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    reactions: {
      type: Map,
      of: String,
      default: new Map(),
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ isPrivate: 1, recipient: 1 });

module.exports = mongoose.model('Message', messageSchema);
