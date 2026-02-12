import express from 'express';
import { createWorkspace, getWorkspaces } from '../controllers/workspaceController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);

export default router;
