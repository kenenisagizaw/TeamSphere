import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { prisma } from "./config/prisma";

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("joinChannel", (channelId: number) => {
    socket.join(`channel_${channelId}`);
  });

  socket.on("sendMessage", async ({ channelId, content, senderId }) => {
    if (!senderId || !content) return;

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        senderId,
      },
      include: { sender: true },
    });

    const outgoing = {
      id: message.id,
      content: message.content,
      userName: message.sender.name,
    };

    io.to(`channel_${channelId}`).emit("receiveMessage", outgoing);
  });

  socket.on("channelCreated", (channel) => {
    io.to(`workspace_${channel.workspaceId}`).emit("channelCreated", channel);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
