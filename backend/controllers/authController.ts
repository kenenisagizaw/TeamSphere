import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/generateToken';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Please fill all fields" });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user.id),
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user.id),
  });
};
