import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
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

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number; email: string };

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
  });

  // 🔐 Secure message sending
  socket.on("sendMessage", async ({ channelId, content }) => {
    if (!content) return;

    try {
      const message = await prisma.message.create({
        data: {
          content,
          channelId,
          senderId: user.id, 
          
        },
        include: { sender: true },
      });

      const outgoing = {
        id: message.id,
        content: message.content,
        userName: message.sender.name,
        createdAt: message.createdAt,
      };

      io.to(`channel_${channelId}`).emit("receiveMessage", outgoing);
    } catch (error) {
      console.error("Message error:", error);
    }
  });

  // Channel created
  socket.on("channelCreated", (channel) => {
    io.to(`workspace_${channel.workspaceId}`).emit(
      "channelCreated",
      channel
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", user.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
