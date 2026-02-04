================================================================================
                    CHAT APPLICATION - SETUP & RUN GUIDE
================================================================================

PREREQUISITES:
- Node.js installed
- MongoDB installed and running

================================================================================
STEP 1: CHECK MONGODB STATUS
================================================================================

Open PowerShell and run:

    Get-Service MongoDB

If status is NOT "Running", start MongoDB with admin privileges:

    Start-Process powershell -Verb RunAs -ArgumentList "net start MongoDB"

================================================================================
STEP 2: START BACKEND SERVER
================================================================================

Open a terminal and run:

    cd c:\Users\sachi\Downloads\Project\chat-app\backend
    npm run dev

Expected output:
    Server running on port 5000
    MongoDB Connected: localhost

================================================================================
STEP 3: START FRONTEND SERVER
================================================================================

Open a NEW terminal and run:

    cd c:\Users\sachi\Downloads\Project\chat-app\frontend
    npm start

Expected output:
    Compiled successfully!
    Local: http://localhost:3000

================================================================================
STEP 4: OPEN THE APPLICATION
================================================================================

Open your browser and go to:

    http://localhost:3000

================================================================================
QUICK COMMANDS REFERENCE
================================================================================

| Command                              | Purpose                    |
|--------------------------------------|----------------------------|
| Get-Service MongoDB                  | Check MongoDB status       |
| npm run dev (in backend folder)      | Start backend on port 5000 |
| npm start (in frontend folder)       | Start frontend on port 3000|
| taskkill /F /IM node.exe             | Stop all servers           |

================================================================================
TROUBLESHOOTING
================================================================================

ERROR: EADDRINUSE: port 5000 already in use
SOLUTION: Run "taskkill /F /IM node.exe" to kill existing processes

ERROR: MongoDB not connected
SOLUTION: Make sure MongoDB service is running

ERROR: ENOENT: package.json not found
SOLUTION: Make sure you are in the correct folder (backend or frontend)

ERROR: Registration failed
SOLUTION: Check if both MongoDB and backend server are running

================================================================================
FOLDER STRUCTURE
================================================================================

chat-app/
├── backend/           <- Run "npm run dev" here
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── models/
│   ├── routes/
│   └── socket/
│
├── frontend/          <- Run "npm start" here
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.txt         <- This file

================================================================================
FEATURES
================================================================================

- User Registration & Login
- Real-time messaging with WebSockets
- Private chats between users
- Group chat rooms
- Send images and files
- Delete individual messages
- Delete chats/groups
- Online/offline status indicators
- Typing indicators
- Responsive design

================================================================================
PORTS
================================================================================

Backend API:    http://localhost:5000
Frontend App:   http://localhost:3000
MongoDB:        localhost:27017

================================================================================
