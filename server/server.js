// server.js - Main server file for Socket.io chat application with MongoDB

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Import models
const Message = require('./models/Message');
const User = require('./models/User');
const Room = require('./models/Room');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet()); // Add security headers
app.use(morgan('combined')); // Logging
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store typing users in memory (real-time data)
const typingUsers = {};

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/socketio-chat', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Initialize default rooms
const initializeRooms = async () => {
  try {
    const defaultRooms = [
      { roomId: 'general', name: 'General' },
      { roomId: 'random', name: 'Random' },
    ];

    for (const roomData of defaultRooms) {
      const existingRoom = await Room.findOne({ roomId: roomData.roomId });
      if (!existingRoom) {
        await Room.create(roomData);
        console.log(`✅ Created default room: ${roomData.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing rooms:', error.message);
  }
};


// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`📱 User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', async (username) => {
    try {
      // Create or update user in database
      const user = await User.findOneAndUpdate(
        { socketId: socket.id },
        {
          socketId: socket.id,
          username,
          isOnline: true,
          currentRoom: 'general',
          lastSeen: new Date(),
        },
        { upsert: true, new: true }
      );

      // Join default room
      socket.join('general');

      // Update room users
      await Room.findOneAndUpdate(
        { roomId: 'general' },
        { $set: { [`users.${socket.id}`]: username } },
        { new: true }
      );

      // Get all online users
      const onlineUsers = await User.find({ isOnline: true });

      // Get all rooms
      const rooms = await Room.find({});

      io.emit('user_list', onlineUsers);
      io.emit('user_joined', { username, id: socket.id });
      socket.emit('room_list', rooms);

      console.log(`✅ ${username} joined the chat`);
    } catch (error) {
      console.error('Error in user_join:', error.message);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Handle chat messages
  socket.on('send_message', async (messageData) => {
    try {
      const user = await User.findOne({ socketId: socket.id });

      const messagePayload = {
        sender: user?.username || 'Anonymous',
        senderId: socket.id,
        message: messageData.message,
        room: messageData.room || 'general',
        delivered: true,
        timestamp: new Date(),
      };

      // Save message to database
      const savedMessage = await Message.create(messagePayload);

      // Update room message count
      await Room.findOneAndUpdate(
        { roomId: messageData.room || 'general' },
        { $inc: { messageCount: 1 } }
      );

      // Emit to specific room if provided, otherwise to all
      if (messageData.room) {
        io.to(messageData.room).emit('receive_message', savedMessage);

        // Send notification to users in the room
        const roomUsers = await User.find({ currentRoom: messageData.room, socketId: { $ne: socket.id } });
        roomUsers.forEach((user) => {
          io.to(user.socketId).emit('new_message_notification', {
            message: `${savedMessage.sender}: ${savedMessage.message}`,
            sender: savedMessage.sender,
            roomId: messageData.room,
          });
        });
      } else {
        io.emit('receive_message', savedMessage);
      }

      // Send delivery confirmation
      socket.emit('message_delivered', { messageId: savedMessage._id });
    } catch (error) {
      console.error('Error sending message:', error.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle room creation
  socket.on('create_room', async (roomName) => {
    try {
      const roomId = roomName.toLowerCase().replace(/\s+/g, '-');

      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        const newRoom = await Room.create({
          roomId,
          name: roomName,
          createdBy: socket.id,
        });

        const allRooms = await Room.find({});
        io.emit('room_list', allRooms);

        io.emit('notification', {
          type: 'room_created',
          message: `New room created: ${roomName}`,
          roomId: roomId,
        });

        console.log(`✅ Room created: ${roomName}`);
      }
    } catch (error) {
      console.error('Error creating room:', error.message);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Handle joining a room
  socket.on('join_room', async (roomId) => {
    try {
      // Leave current rooms
      const userRooms = await Room.find({ [`users.${socket.id}`]: { $exists: true } });
      for (const room of userRooms) {
        socket.leave(room.roomId);
        await Room.findOneAndUpdate(
          { roomId: room.roomId },
          { $unset: { [`users.${socket.id}`]: 1 } }
        );
      }

      // Update user's current room
      await User.findOneAndUpdate(
        { socketId: socket.id },
        { currentRoom: roomId }
      );

      // Join new room
      socket.join(roomId);
      const room = await Room.findOne({ roomId });

      if (room) {
        await Room.findOneAndUpdate(
          { roomId },
          { $set: { [`users.${socket.id}`]: (await User.findOne({ socketId: socket.id }))?.username } }
        );

        socket.emit('room_joined', { roomId, roomName: room.name });

        // Notify room users about new member
        io.to(roomId).emit('notification', {
          type: 'user_joined_room',
          message: `User joined the room`,
          roomId: roomId,
        });

        console.log(`✅ User ${socket.id} joined room: ${roomId}`);
      }
    } catch (error) {
      console.error('Error joining room:', error.message);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle typing indicator
  socket.on('typing', async (isTyping) => {
    try {
      const user = await User.findOne({ socketId: socket.id });

      if (user) {
        if (isTyping) {
          typingUsers[socket.id] = user.username;
        } else {
          delete typingUsers[socket.id];
        }

        io.emit('typing_users', Object.values(typingUsers));
      }
    } catch (error) {
      console.error('Error in typing handler:', error.message);
    }
  });

  // Handle private messages
  socket.on('private_message', async ({ to, message }) => {
    try {
      const senderUser = await User.findOne({ socketId: socket.id });

      const messageData = {
        sender: senderUser?.username || 'Anonymous',
        senderId: socket.id,
        message,
        recipient: to,
        isPrivate: true,
        delivered: true,
        timestamp: new Date(),
      };

      const savedMessage = await Message.create(messageData);

      io.to(to).emit('private_message', savedMessage);
      socket.emit('private_message', savedMessage);

      // Send notification for private message
      io.to(to).emit('new_message_notification', {
        message: `Private message from ${senderUser?.username || 'Anonymous'}: ${message}`,
        sender: senderUser?.username || 'Anonymous',
        isPrivate: true,
      });

      socket.emit('message_delivered', { messageId: savedMessage._id });
    } catch (error) {
      console.error('Error sending private message:', error.message);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async ({ messageId, reaction }) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $set: { [`reactions.${socket.id}`]: reaction } },
        { new: true }
      );

      io.emit('reaction_added', { messageId, reaction, userId: socket.id });
    } catch (error) {
      console.error('Error adding reaction:', error.message);
    }
  });

  // Handle message read receipts
  socket.on('message_read', async (messageId) => {
    try {
      await Message.findByIdAndUpdate(
        messageId,
        { read: true }
      );

      socket.broadcast.emit('message_read_receipt', { messageId, userId: socket.id });
    } catch (error) {
      console.error('Error marking message as read:', error.message);
    }
  });

  // Handle file sharing
  socket.on('share_file', async (fileData) => {
    try {
      const user = await User.findOne({ socketId: socket.id });

      const messagePayload = {
        sender: user?.username || 'Anonymous',
        senderId: socket.id,
        fileName: fileData.name,
        fileUrl: fileData.url,
        fileType: fileData.type,
        isFile: true,
        room: fileData.room || 'general',
        delivered: true,
        timestamp: new Date(),
      };

      const savedMessage = await Message.create(messagePayload);

      io.emit('receive_message', savedMessage);

      // Send notification for file share
      Object.keys(io.sockets.sockets).forEach((userId) => {
        if (userId !== socket.id) {
          io.to(userId).emit('new_message_notification', {
            message: `${user?.username || 'Anonymous'} shared a file: ${fileData.name}`,
            sender: user?.username || 'Anonymous',
            isFile: true,
          });
        }
      });

      socket.emit('message_delivered', { messageId: savedMessage._id });
    } catch (error) {
      console.error('Error sharing file:', error.message);
      socket.emit('error', { message: 'Failed to share file' });
    }
  });

  // Handle message pagination
  socket.on('load_messages', async ({ offset = 0, limit = 50, roomId = 'general' }) => {
    try {
      const query = roomId ? { room: roomId } : {};
      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      const totalCount = await Message.countDocuments(query);

      socket.emit('messages_loaded', {
        messages: messages.reverse(),
        hasMore: offset + limit < totalCount,
      });
    } catch (error) {
      console.error('Error loading messages:', error.message);
      socket.emit('error', { message: 'Failed to load messages' });
    }
  });

  // Handle message search
  socket.on('search_messages', async ({ query, roomId }) => {
    try {
      const searchFilter = {
        $or: [
          { message: { $regex: query, $options: 'i' } },
          { sender: { $regex: query, $options: 'i' } },
        ],
      };

      if (roomId) {
        searchFilter.room = roomId;
      }

      const searchResults = await Message.find(searchFilter)
        .sort({ timestamp: -1 })
        .limit(50);

      socket.emit('search_results', {
        messages: searchResults,
        query: query,
      });
    } catch (error) {
      console.error('Error searching messages:', error.message);
      socket.emit('error', { message: 'Failed to search messages' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      const user = await User.findOneAndUpdate(
        { socketId: socket.id },
        { isOnline: false, lastSeen: new Date() }
      );

      if (user) {
        console.log(`📱 ${user.username} left the chat`);

        // Remove user from all rooms
        await Room.updateMany(
          { [`users.${socket.id}`]: { $exists: true } },
          { $unset: { [`users.${socket.id}`]: 1 } }
        );

        io.emit('user_left', { username: user.username, id: socket.id });
        io.emit('notification', {
          type: 'user_left',
          message: `${user.username} left the chat`,
        });
      }

      delete typingUsers[socket.id];

      const onlineUsers = await User.find({ isOnline: true });
      io.emit('user_list', onlineUsers);
      io.emit('typing_users', Object.values(typingUsers));
    } catch (error) {
      console.error('Error in disconnect handler:', error.message);
    }
  });

  // Error handling for socket events
  socket.on('error', (error) => {
    console.error('Socket error:', error.message);
  });
});
    
// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Get messages with pagination
app.get('/api/messages', async (req, res) => {
  try {
    const { offset = 0, limit = 50, room = 'general' } = req.query;
    const skip = parseInt(offset);
    const take = parseInt(limit);

    const messages = await Message.find({ room })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(take);

    const totalCount = await Message.countDocuments({ room });

    res.json({
      messages: messages.reverse(),
      hasMore: skip + take < totalCount,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Search messages
app.get('/api/search', async (req, res) => {
  try {
    const { q, room } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const searchFilter = {
      $or: [
        { message: { $regex: q, $options: 'i' } },
        { sender: { $regex: q, $options: 'i' } },
      ],
    };

    if (room) {
      searchFilter.room = room;
    }

    const searchResults = await Message.find(searchFilter)
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      messages: searchResults,
      query: q,
    });
  } catch (error) {
    console.error('Error searching messages:', error.message);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Get online users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ isOnline: true });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await initializeRooms();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Server shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminating...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = { app, server, io };