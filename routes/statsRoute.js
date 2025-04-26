import express from 'express';
import { getAllStats } from '../controllers/stats.controller.js';
const router = express.Router();

router.get('/', getAllStats);

export default router;
