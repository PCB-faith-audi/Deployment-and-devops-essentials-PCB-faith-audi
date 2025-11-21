const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    users: {
      type: Map,
      of: String,
      default: new Map(),
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

roomSchema.index({ roomId: 1 });
roomSchema.index({ name: 1 });

module.exports = mongoose.model('Room', roomSchema);
