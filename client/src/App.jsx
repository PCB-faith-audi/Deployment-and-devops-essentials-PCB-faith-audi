import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from './socket/socket';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const messagesEndRef = useRef(null);
  
  const {
    connect,
    disconnect,
    sendMessage,
    messages,
    users,
    typingUsers,
    rooms,
    currentRoom,
    createRoom,
    joinRoom,
    setTyping,
    unreadCount,
    searchMessages,
    searchResults
  } = useSocket();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      connect(username);
      setIsConnected(true);
      setShowLogin(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
      setTyping(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleCreateRoom = () => {
    const roomName = prompt('Enter room name:');
    if (roomName) {
      createRoom(roomName);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = prompt('Enter search query:');
    if (query) {
      searchMessages(query);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (showLogin) {
    return (
      <div className="login-container">
        <h1>Socket.io Chat</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Socket.io Chat</h1>
        <div className="user-info">
          <span>Logged in as: {username}</span>
          <span>Online Users: {users.length}</span>
          {unreadCount > 0 && (
            <span className="unread-count">Unread: {unreadCount}</span>
          )}
        </div>
      </div>

      <div className="chat-main">
        <div className="sidebar">
          <div className="rooms-section">
            <h3>Rooms</h3>
            <button onClick={handleCreateRoom}>Create Room</button>
            <ul>
              {rooms.map((room) => (
                <li key={room.name}>
                  <button 
                    onClick={() => joinRoom(room.name.toLowerCase())}
                    className={currentRoom === room.name.toLowerCase() ? 'active' : ''}
                  >
                    {room.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="users-section">
            <h3>Online Users</h3>
            <ul>
              {users.map((user) => (
                <li key={user.id}>{user.username}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="chat-content">
          <div className="messages-container">
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender === username ? 'own' : ''}`}>
                  {msg.system ? (
                    <div className="system-message">{msg.message}</div>
                  ) : (
                    <>
                      <strong>{msg.sender}</strong>
                      <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      <p>{msg.message}</p>
                      {msg.isFile && (
                        <div className="file-message">
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                            📎 {msg.fileName}
                          </a>
                        </div>
                      )}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="reactions">
                          {msg.reactions.map((reaction, idx) => (
                            <span key={idx}>{reaction.reaction}</span>
                          ))}
                        </div>
                      )}
                      {msg.delivered && <span className="delivery-status">✓</span>}
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
            />
            <button type="submit">Send</button>
            <button type="button" onClick={handleSearch}>Search</button>
          </form>
        </div>
      </div>

      <div className="chat-footer">
        <button onClick={() => {
          disconnect();
          setIsConnected(false);
          setShowLogin(true);
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;