import type { Response } from "express";
import path from "path";
import type { AuthRequest } from "../middlewares/authMiddleware";

export const uploadFile = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const safeName = path.basename(req.file.filename);
  return res.status(201).json({
    fileUrl: `/uploads/${safeName}`,
  });
};
