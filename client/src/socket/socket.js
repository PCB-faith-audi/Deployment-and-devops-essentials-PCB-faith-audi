// socket.js - Socket.io client setup

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Connect to socket server
  const connect = (username) => {
    socket.connect();
    if (username) {
      socket.emit('user_join', username);
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a message
  const sendMessage = (message) => {
    socket.emit('send_message', { message, room: currentRoom });
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  // Set typing status
  const setTyping = (isTyping) => {
    socket.emit('typing', isTyping);
  };

  // Create a new room
  const createRoom = (roomName) => {
    socket.emit('create_room', roomName);
  };

  // Join a room
  const joinRoom = (roomId) => {
    socket.emit('join_room', roomId);
    setCurrentRoom(roomId);
  };

  // Share a file
  const shareFile = (fileData) => {
    socket.emit('share_file', fileData);
  };

  // Add reaction to a message
  const addReaction = (messageId, reaction) => {
    socket.emit('add_reaction', { messageId, reaction });
  };

  // Mark message as read
  const markMessageAsRead = (messageId) => {
    socket.emit('message_read', messageId);
  };

  // Load messages with pagination
  const loadMessages = (offset = 0, limit = 50) => {
    socket.emit('load_messages', { offset, limit, roomId: currentRoom });
  };

  // Search messages
  const searchMessages = (query) => {
    socket.emit('search_messages', { query, roomId: currentRoom });
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFd2xqZ2RlY2NlZmhqbnF3fIKFjI+Smp2enJmVk5CNi4mHh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/');
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (e) {
      console.log("Notification sound error:", e);
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
      // Play sound and show notification for private messages
      playNotificationSound();
      showBrowserNotification('Private Message', `${message.sender}: ${message.message}`);
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      // You could add a system message here
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (user) => {
      // You could add a system message here
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Room events
    const onRoomList = (roomList) => {
      setRooms(roomList);
    };

    const onRoomJoined = (roomData) => {
      setCurrentRoom(roomData.roomId);
      // Clear messages when joining a new room
      setMessages([]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Reaction events
    const onReactionAdded = (reactionData) => {
      // Update message with reaction
      setMessages(prev => prev.map(msg => 
        msg.id === reactionData.messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), reactionData] }
          : msg
      ));
    };

    // Read receipt events
    const onMessageReadReceipt = (receiptData) => {
      setMessages(prev => prev.map(msg => 
        msg.id === receiptData.messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), receiptData.userId] }
          : msg
      ));
    };

    // Notification events
    const onNewMessageNotification = (notificationData) => {
      setNotifications(prev => [...prev, notificationData]);
      playNotificationSound();
      showBrowserNotification('New Message', notificationData.message);
    };

    const onNotification = (notificationData) => {
      setNotifications(prev => [...prev, notificationData]);
      playNotificationSound();
      showBrowserNotification('Notification', notificationData.message);
    };

    // Unread count events
    const onUnreadCountUpdate = (count) => {
      setUnreadCount(count);
    };

    // Pagination events
    const onMessagesLoaded = (data) => {
      // Prepend loaded messages to existing messages
      setMessages(prev => [...data.messages, ...prev]);
    };

    // Search events
    const onSearchResults = (data) => {
      setSearchResults(data.messages);
    };

    // Delivery confirmation events
    const onMessageDelivered = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, delivered: true }
          : msg
      ));
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.on('typing_users', onTypingUsers);
    socket.on('reaction_added', onReactionAdded);
    socket.on('message_read_receipt', onMessageReadReceipt);
    socket.on('new_message_notification', onNewMessageNotification);
    socket.on('notification', onNotification);
    socket.on('unread_count_update', onUnreadCountUpdate);
    socket.on('messages_loaded', onMessagesLoaded);
    socket.on('search_results', onSearchResults);
    socket.on('message_delivered', onMessageDelivered);

    // Request notification permission on mount
    requestNotificationPermission();

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('typing_users', onTypingUsers);
      socket.off('reaction_added', onReactionAdded);
      socket.off('message_read_receipt', onMessageReadReceipt);
      socket.off('new_message_notification', onNewMessageNotification);
      socket.off('notification', onNotification);
      socket.off('unread_count_update', onUnreadCountUpdate);
      socket.off('messages_loaded', onMessagesLoaded);
      socket.off('search_results', onSearchResults);
      socket.off('message_delivered', onMessageDelivered);
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    rooms,
    currentRoom,
    unreadCount,
    notifications,
    searchResults,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    createRoom,
    joinRoom,
    shareFile,
    addReaction,
    markMessageAsRead,
    loadMessages,
    searchMessages,
    playNotificationSound,
    requestNotificationPermission,
    showBrowserNotification,
  };
};

export default socket;