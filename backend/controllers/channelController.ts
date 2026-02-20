import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create a channel
export const createChannel = async (req: AuthRequest, res: Response) => {
  const { name, workspaceId } = req.body;

  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!name || !workspaceId)
    return res.status(400).json({ message: "Name and workspaceId required" });

  //  Check user is member of workspace
  const membership = await prisma.workspaceMember.findUnique({
    where: {

      userId_workspaceId: {
        userId: req.user.id,
        workspaceId: Number(workspaceId),
      },
    },
  });

  if (!membership)
    return res.status(403).json({ message: "Not a member of this workspace" });

  const channel = await prisma.channel.create({
    data: {
      name,
      workspaceId: Number(workspaceId),
    },
  });

  res.status(201).json(channel);
};


// List channels for a workspace
export const getChannels = async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;

  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  //  Check membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: req.user.id,
        workspaceId: Number(workspaceId),
      },
    },
  });

  if (!membership)
    return res.status(403).json({ message: "Access denied" });

  const channels = await prisma.channel.findMany({
    where: { workspaceId: Number(workspaceId) },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  res.json(channels);
};
export const getChannelMessages = async (req: AuthRequest, res: Response) => {
  const { channelId } = req.params;

  const messages = await prisma.message.findMany({
    where: { channelId: Number(channelId) },
    include: { sender: true },
    orderBy: { createdAt: 'asc' },
  });

    const formatted = messages.map((message) => ({
      id: message.id,
      content: message.content,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileType: message.fileType,
      createdAt: message.createdAt.toISOString(),
      userName: message.sender.name,
      userId: message.senderId,
    }));

  res.json(formatted);
};
