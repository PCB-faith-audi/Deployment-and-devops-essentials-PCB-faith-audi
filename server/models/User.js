const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    currentRoom: {
      type: String,
      default: 'general',
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.index({ socketId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });

module.exports = mongoose.model('User', userSchema);
