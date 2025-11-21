# Deployment and DevOps for MERN Applications - Socket.io Chat

A real-time chat application built with React, Node.js, Express, Socket.io, and MongoDB. This project demonstrates production-ready MERN stack deployment with CI/CD pipelines, monitoring, and security best practices.

## 🚀 Live Deployment

- **Frontend**: [Deploy to Vercel, Netlify, or GitHub Pages - URL to be added]
- **Backend API**: [Deploy to Render, Railway, or Heroku - URL to be added]
- **Database**: [MongoDB Atlas cluster - connection details in documentation]

## 📋 Project Overview

This assignment focuses on:
1. Preparing your MERN application for production deployment
2. Deploying the backend to a cloud platform (Render, Railway, or Heroku)
3. Deploying the frontend to a static hosting service (Vercel, Netlify, or GitHub Pages)
4. Setting up CI/CD pipelines with GitHub Actions
5. Implementing monitoring and maintenance strategies

## 🏗️ Project Structure

```
deployment-and-devops-essentials-w4kr10/
├── server/
│   ├── models/                 # MongoDB schemas
│   │   ├── Message.js         # Message model with indexes
│   │   ├── User.js            # User model for online status tracking
│   │   └── Room.js            # Room model for chat rooms
│   ├── server.js              # Main Express + Socket.io server
│   ├── package.json           # Server dependencies
│   ├── .env                   # Server environment variables (local)
│   └── .env.example           # Template for environment variables
├── client/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── socket/
│   │   │   └── socket.js      # Socket.io client configuration
│   │   └── App.css            # Styling
│   ├── package.json           # Client dependencies
│   ├── vite.config.js         # Vite build configuration
│   ├── .env                   # Client environment variables (local)
│   └── .env.example           # Template for environment variables
├── Week7-Assignment.md        # Detailed assignment instructions
└── README.md                  # This file
```

## 📦 Features

- **Real-time Communication**: Socket.io for instant messaging
- **Multiple Chat Rooms**: Users can create and join different rooms
- **Private Messaging**: Direct messages between users
- **Message Reactions**: React to messages with emojis
- **File Sharing**: Share files in chat
- **Message Search**: Search messages by content
- **Typing Indicators**: See when users are typing
- **Unread Messages**: Track unread message counts
- **Persistent Storage**: MongoDB for data persistence
- **Production Security**: Helmet, CORS, and error handling
- **Logging**: Morgan HTTP request logging
- **Health Checks**: API health endpoint for monitoring

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **Mongoose** - MongoDB ODM
- **Helmet** - Security headers
- **Morgan** - HTTP logging
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Socket.io Client** - Real-time client
- **JavaScript** - ES6+

### Database
- **MongoDB** - NoSQL database
- **MongoDB Atlas** - Cloud hosting (optional)

## 📖 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas account)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/PLP-MERN-Stack-Development/deployment-and-devops-essentials-w4kr10.git
   cd deployment-and-devops-essentials-w4kr10
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   
   # Create .env file from template
   cp .env.example .env
   
   # Update .env with your MongoDB URI (local or Atlas)
   # MONGODB_URI=mongodb://localhost:27017/socketio-chat
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/socketio-chat
   
   # Start the server
   npm run dev
   ```

3. **Setup Client** (in another terminal)
   ```bash
   cd client
   npm install
   
   # Create .env file from template
   cp .env.example .env
   
   # Start the development server
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:5173 in your browser
   - The app will connect to the server at http://localhost:5000

### Environment Variables

#### Server (.env)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/socketio-chat
```

For production with MongoDB Atlas:
```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/socketio-chat?retryWrites=true&w=majority
```

#### Client (.env)
```env
VITE_SOCKET_URL=http://localhost:5000
```

## 🗄️ Database Setup

### Local MongoDB
```bash
# Windows (with MongoDB installed)
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user with read/write permissions
4. Get connection string
5. Add to `.env`: `MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/socketio-chat`

## 🚀 Deployment Guide

### Backend Deployment (Choose One)

#### Option 1: Deploy to Render
1. Push code to GitHub
2. Create account at [render.com](https://render.com)
3. Create new Web Service from GitHub repo
4. Set environment variables in Render dashboard
5. Deploy

#### Option 2: Deploy to Railway
1. Push code to GitHub
2. Create account at [railway.app](https://railway.app)
3. Create new project and connect GitHub repo
4. Add MongoDB plugin or connect Atlas
5. Set environment variables
6. Deploy

#### Option 3: Deploy to Heroku
1. Install Heroku CLI
2. Push code to GitHub
3. Create account at [heroku.com](https://heroku.com)
4. `heroku create`
5. `heroku config:set KEY=VALUE` for each env variable
6. `git push heroku main`

### Frontend Deployment (Choose One)

#### Option 1: Deploy to Vercel
```bash
npm install -g vercel
vercel
# Follow prompts to deploy
```

#### Option 2: Deploy to Netlify
```bash
npm run build
# Connect site to Git repo at netlify.com
# Or use: npm install -g netlify-cli && netlify deploy --prod --dir=dist
```

#### Option 3: Deploy to GitHub Pages
1. Add to `vite.config.js`: `base: '/repo-name/'`
2. Push to GitHub
3. Enable GitHub Pages in repo settings

## 📊 CI/CD Pipeline Setup

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd server && npm install
          cd ../client && npm install
      
      - name: Build client
        run: cd client && npm run build
      
      - name: Deploy to Render/Railway/Vercel
       
```

## 📈 Monitoring and Maintenance

### Health Check Endpoint
- **URL**: `GET /api/health`
- **Response**: `{ status: 'OK', timestamp: '...', uptime: ... }`

### Recommended Monitoring Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry.io
- **Performance Monitoring**: New Relic, DataDog
- **Logging**: LogRocket, ELK Stack

### Database Backups
- MongoDB Atlas automatically backups data
- Schedule periodic manual exports for critical data

### Updates and Patches
- Keep Node.js updated
- Review security advisories: `npm audit`
- Update dependencies: `npm update`

## 🔒 Security Considerations

✅ **Implemented:**
- Helmet.js for security headers
- CORS configuration
- Environment variable protection
- Error handling and logging
- Graceful shutdown handling

📋 **Additional Steps for Production:**
- Rate limiting on API endpoints
- JWT authentication for user sessions
- HTTPS/SSL certificates
- API key authentication
- Input validation and sanitization
- SQL/NoSQL injection prevention
- XSS protection

## 📝 API Endpoints

### Messages
- `GET /api/messages?room=general&offset=0&limit=50` - Get messages
- `GET /api/search?q=query&room=general` - Search messages

### Users
- `GET /api/users` - Get online users

### Rooms
- `GET /api/rooms` - Get all rooms

### Health
- `GET /api/health` - Health check

## 🔄 Socket.io Events

### Client → Server
- `user_join` - User joins chat
- `send_message` - Send message to room
- `create_room` - Create new room
- `join_room` - Join specific room
- `typing` - User typing indicator
- `private_message` - Send private message
- `add_reaction` - React to message
- `message_read` - Mark message as read
- `share_file` - Share file
- `search_messages` - Search messages

### Server → Client
- `user_list` - List of online users
- `user_joined` - New user joined
- `receive_message` - New message received
- `room_list` - List of available rooms
- `room_joined` - Room join confirmation
- `typing_users` - Users currently typing
- `private_message` - Private message received
- `new_message_notification` - Message notification
- `message_delivered` - Message delivery confirmation

## 🧪 Testing

Run tests with:
```bash
cd server
npm test

cd ../client
npm test
```

## 📚 Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [MongoDB Mongoose Guide](https://mongoosejs.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## Deployment links.
Netlify: https://chatios.netlify.app/
Render: https://deployment-and-devops-5hby.onrender.com

## CI/CD Pipeline

The assignment includes templates for setting up GitHub Actions workflows:
- `frontend-ci.yml`: Tests and builds the React application
- `backend-ci.yml`: Tests the Express.js backend
- `frontend-cd.yml`: Deploys the frontend to your chosen platform
- `backend-cd.yml`: Deploys the backend to your chosen platform

## Submission

Your work will be automatically submitted when you push to your GitHub Classroom repository. Make sure to:

1. Complete all deployment tasks
2. Set up CI/CD pipelines with GitHub Actions
3. Deploy both frontend and backend to production
4. Document your deployment process in the README.md
5. Include screenshots of your CI/CD pipeline in action
6. Add URLs to your deployed applications

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/) 