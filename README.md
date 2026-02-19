# TeamSphere 🚀

A real-time team chat application built with React, TypeScript, Node.js, Express, Socket.IO, and Prisma.
Supports channels, workspaces, file uploads, emojis, typing indicators, and notifications for seamless collaboration.

## Features ✨

- Real-time messaging with Socket.IO
- Multiple workspaces & channels
- User authentication with JWT
- Typing indicators for active conversations
- File uploads (images, documents, etc.)
- Emoji picker integration for messages
- Notification toasts for success/error messages
- Responsive design with React + Tailwind CSS
- Secure backend with Express + Prisma

## Tech Stack 🛠

- Frontend: React, TypeScript, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, TypeScript
- Realtime: Socket.IO
- Database: PostgreSQL (via Prisma ORM)
- Authentication: JWT
- File Storage: Local uploads (can integrate S3 later)

## Screenshots 📸

(Add your screenshots or GIFs here)

## Installation 💻

### Backend

Clone the repo:

```bash
git clone https://github.com/yourusername/chatly.git
cd chatly/backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in `backend/`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/chatly"
JWT_SECRET="your_jwt_secret"
PORT=5000
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

Start the backend server:

```bash
npm run dev
```

### Frontend

Navigate to the frontend folder:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

Open in browser at http://localhost:5173

## Usage 🚀

1. Register or login.
2. Create a workspace.
3. Create channels within the workspace.
4. Start real-time messaging with team members.
5. Upload files and add emojis to messages.
6. Enjoy typing indicators and notification toasts!

## Contributing 🤝

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature-name`
6. Open a pull request

## Future Features 🌟

- Threaded conversations
- Video/voice calls
- Integrate cloud file storage (AWS S3, Firebase)
- Message search and pinning
- Admin controls for workspaces
- Push notifications for mobile

## License ⚖️

This project is licensed under the MIT License.
