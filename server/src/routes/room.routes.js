import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getRoomByCode } from '../services/room.service.js';

const router = Router();

// Get room info by code (used for link-based joins before socket connection)
router.get('/:code', requireAuth, async (req, res, next) => {
  try {
    const room = await getRoomByCode(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    // Never expose locked questions over REST
    const { questions: _q, ...safeRoom } = room;
    res.json({ room: safeRoom });
  } catch (err) { next(err); }
});

export default router;
