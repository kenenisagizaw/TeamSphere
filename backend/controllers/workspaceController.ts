import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create a workspace
export const createWorkspace = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: req.user.id,
      members: { create: [{ userId: req.user.id, role: 'owner' }] },
    },
    include: { members: true },
  });

  res.status(201).json(workspace);
};

// List user workspaces
export const getWorkspaces = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: req.user.id },
    include: { workspace: true },
  });

  res.json(workspaces);
};
