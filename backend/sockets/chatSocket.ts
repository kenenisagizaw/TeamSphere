import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma";

interface ChatMessage {
  channelId: number;
  senderId: number;
  content: string;
  fileUrl?: string;
  userName?: string;
}

export const chatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("New client connected", socket.id);

    socket.on("joinChannel", (channelId: number) => {
      socket.join(`channel_${channelId}`);
      console.log(`Socket ${socket.id} joined channel_${channelId}`);
    });

    socket.on("sendMessage", async (msg: ChatMessage) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: msg.content || "",
            fileUrl: msg.fileUrl || null,
            senderId: msg.senderId,
            channelId: msg.channelId,
          },
          include: { sender: true },
        });

        const formattedMessage = {
          id: message.id,
          content: message.content,
          fileUrl: message.fileUrl,
          createdAt: message.createdAt.toISOString(),
          userName: message.sender.name,
          userId: message.senderId,
        };

        io.to(`channel_${msg.channelId}`).emit("receiveMessage", formattedMessage);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("typing", (data) => {
      socket.to(`channel_${data.channelId}`).emit("userTyping", data);
    });

    socket.on("stoppedTyping", (data) => {
      socket.to(`channel_${data.channelId}`).emit("userStoppedTyping", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
};
