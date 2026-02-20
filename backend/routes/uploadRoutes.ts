import express from "express";
import { uploadFile } from "../controllers/uploadController";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";

const router = express.Router();

router.post("/upload", protect, upload.single("file"), uploadFile);
router.post("/uploads", protect, upload.single("file"), uploadFile);

export default router;
