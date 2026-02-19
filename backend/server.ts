import { createServer } from "http";
import jwt from "jsonwebtoken";
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

// 🔐 SOCKET AUTH MIDDLEWARE
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error("Authentication error"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };

    // Attach user to socket
    (socket as any).user = decoded;

    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  console.log("Authenticated user connected:", user.id);

  // Join channel
  socket.on("joinChannel", (channelId: number) => {
    socket.join(`channel_${channelId}`);
    console.log(`User ${user.id} joined channel ${channelId}`);
  });

  // Typing indicators
  socket.on("typing", (data: { channelId: number; userName: string }) => {
    socket.to(`channel_${data.channelId}`).emit("userTyping", {
      userId: user.id,
      userName: data.userName,
    });
  });

  socket.on("stoppedTyping", (data: { channelId: number }) => {
    socket.to(`channel_${data.channelId}`).emit("userStoppedTyping", {
      userId: user.id,
      userName: (socket as any).user.email,
    });
  });

  // 🔐 Send text or emoji messages
  socket.on(
    "sendMessage",
    async (msg: {
      channelId: number;
      content?: string;
      emoji?: string;
      fileUrl?: string;
    }) => {
      if (!msg.content && !msg.emoji && !msg.fileUrl) return;

      try {
        const message = await prisma.message.create({
          data: {
            content: msg.content || msg.emoji || "",
            fileUrl: msg.fileUrl || null,
            senderId: user.id,
            channelId: msg.channelId,
          },
          include: { sender: true },
        });

        const outgoing = {
          id: message.id,
          content: message.content,
          fileUrl: message.fileUrl,
          userName: message.sender.name,
          createdAt: message.createdAt.toISOString(),
        };

        io.to(`channel_${msg.channelId}`).emit("receiveMessage", outgoing);
      } catch (error) {
        console.error("Message error:", error);
      }
    }
  );

  // 🔗 Send files
  socket.on(
    "sendFile",
    async (data: {
      channelId: number;
      fileName: string;
      fileType: string;
      fileUrl: string;
    }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: "",
            fileUrl: data.fileUrl,
            senderId: user.id,
            channelId: data.channelId,
          },
          include: { sender: true },
        });

        io.to(`channel_${data.channelId}`).emit("receiveMessage", {
          id: message.id,
          content: "",
          fileUrl: message.fileUrl,
          userName: message.sender.name,
          createdAt: message.createdAt.toISOString(),
        });
      } catch (error) {
        console.error("File send error:", error);
      }
    }
  );

  // Channel created
  socket.on("channelCreated", (channel) => {
    io.to(`workspace_${channel.workspaceId}`).emit("channelCreated", channel);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", user.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
