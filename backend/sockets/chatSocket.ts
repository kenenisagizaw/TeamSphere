import { Server, Socket } from 'socket.io';
import { prisma } from '../config/prisma';

interface ChatMessage {
  channelId: number;
  senderId: number;
  content: string;
}

export const chatSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected', socket.id);

    // Join a channel
    socket.on('joinChannel', (channelId: number) => {
      socket.join(`channel_${channelId}`);
      console.log(`Socket ${socket.id} joined channel_${channelId}`);
    });

    // Send message
 socket.on('sendMessage', async (msg: ChatMessage) => {
  try {
    const message = await prisma.message.create({
      data: {
        content: msg.content,
        senderId: msg.senderId,
        channelId: msg.channelId,
      },
      include: { sender: true },
    });

    const formattedMessage = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(), 
      userName: message.sender.name,
      userId: message.senderId,
    };

    io.to(`channel_${msg.channelId}`).emit('receiveMessage', formattedMessage);
  } catch (err) {
    console.error(err);
  }
});



    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
      
    });
  });
};
