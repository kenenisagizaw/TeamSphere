import express from "express";
import { prisma } from "../config/prisma";
import { upload } from "../middlewares/uploadMiddleware";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  const { channelId, senderId } = req.body;

  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const message = await prisma.message.create({
    data: {
      channelId: Number(channelId),
      senderId: Number(senderId),
      content: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    },
    include: { sender: true },
  });

  res.json(message);
});

export default router;
