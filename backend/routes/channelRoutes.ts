import express from 'express';
import { createChannel, getChannels } from '../controllers/channelController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createChannel); // Create channel
router.get('/:workspaceId', protect, getChannels); // Get channels for workspace

export default router;
