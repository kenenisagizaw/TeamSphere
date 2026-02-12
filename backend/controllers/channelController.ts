import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { prisma } from '../config/prisma';

// Create a channel
export const createChannel = async (req: AuthRequest, res: Response) => {
  const { name, workspaceId } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  if (!name || !workspaceId)
    return res.status(400).json({ message: 'Name and workspaceId required' });

  const channel = await prisma.channel.create({
    data: { name, workspaceId },
  });

  res.status(201).json(channel);
};

// List channels for a workspace
export const getChannels = async (req: AuthRequest, res: Response) => {
  const { workspaceId } = req.params;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const channels = await prisma.channel.findMany({
    where: { workspaceId: Number(workspaceId) },
    include: { messages: true },
  });

  res.json(channels);
};
