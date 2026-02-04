# Real-Time Chat Application

A full-featured real-time chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) and WebSockets (Socket.io).

![Chat App](https://via.placeholder.com/800x400?text=Real-Time+Chat+Application)

## Features

### Core Features
- 💬 **Real-time Messaging** - Instant message delivery using WebSockets
- 👥 **Group Chats** - Create and manage group conversations
- 🔒 **Private Conversations** - One-on-one private messaging
- 📎 **Media Sharing** - Send images and files (up to 10MB)
- 💾 **Persistent Messages** - All messages saved to MongoDB
- ✅ **Read Receipts** - Know when messages are read
- ⌨️ **Typing Indicators** - See when others are typing
- 🟢 **Online Status** - Real-time user presence

### Authentication
- 🔐 **JWT Authentication** - Secure token-based auth
- 📝 **User Registration** - Create new accounts
- 🔑 **Login/Logout** - Session management
- 👤 **Profile Management** - Update username, bio, and avatar

### UI/UX
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern Interface** - Clean, intuitive design
- 😊 **Emoji Picker** - Express yourself with emojis
- 🔍 **Search** - Find users and conversations

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Socket.io Client** - WebSocket client
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **react-icons** - Icon library
- **emoji-picker-react** - Emoji support

## Project Structure

```
chat-app/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── upload.js          # File upload config
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Room.js            # Chat room schema
│   │   └── Message.js         # Message schema
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── users.js           # User endpoints
│   │   ├── rooms.js           # Room endpoints
│   │   ├── messages.js        # Message endpoints
│   │   └── upload.js          # Upload endpoints
│   ├── socket/
│   │   └── socketHandler.js   # Socket.io events
│   ├── uploads/               # Uploaded files
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow/
│   │   │   ├── CreateRoomModal/
│   │   │   ├── MessageInput/
│   │   │   ├── MessageList/
│   │   │   ├── ProfileModal/
│   │   │   ├── RoomInfo/
│   │   │   ├── RoomList/
│   │   │   ├── Sidebar/
│   │   │   ├── UserSearch/
│   │   │   └── WelcomeScreen/
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   ├── ChatContext.js
│   │   │   └── SocketContext.js
│   │   ├── pages/
│   │   │   ├── Chat.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or install separately
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment variables**
   
   Create/edit `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   
   In separate terminals:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. **Open the app**
   
   Navigate to `http://localhost:3000` in your browser.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get/search users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/profile` | Update profile |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | Get user's rooms |
| POST | `/api/rooms` | Create group room |
| POST | `/api/rooms/private` | Create/get private chat |
| GET | `/api/rooms/:id` | Get room details |
| PUT | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:roomId` | Get room messages |
| POST | `/api/messages/:roomId` | Send message |
| PUT | `/api/messages/:id` | Edit message |
| DELETE | `/api/messages/:id` | Delete message |

## Socket Events

### Client → Server
- `room:join` - Join a chat room
- `room:leave` - Leave a chat room
- `message:send` - Send a message
- `typing:start` - Started typing
- `typing:stop` - Stopped typing
- `message:read` - Mark as read

### Server → Client
- `message:new` - New message received
- `message:updated` - Message edited
- `message:deleted` - Message deleted
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `room:new` - Added to new room
- `room:updated` - Room updated
- `room:deleted` - Room deleted

## Screenshots

### Login Page
Modern authentication with gradient design.

### Chat Interface
Clean messaging interface with sidebar navigation.

### Group Chat
Create groups and manage members.

### Mobile Responsive
Works seamlessly on all devices.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Socket.io for real-time functionality
- React team for the amazing framework
- MongoDB for the flexible database
- All open-source contributors
