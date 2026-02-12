import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import channelRoutes from './routes/channelRoutes';
import { chatSocket } from './sockets/chatSocket';

const PORT = process.env.PORT || 5000;

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: "*", methods: ["GET","POST"] } });

// Socket.io chat events
chatSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
