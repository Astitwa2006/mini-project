import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getQuestionPool } from '../services/question.service.js';
import { TOPIC_META } from '../services/rss.service.js';

const router = Router();

// List available topics
router.get('/topics', (_req, res) => {
  res.json({ topics: TOPIC_META });
});

// Preview questions for given topics (host use, no correct answers exposed)
router.get('/preview', requireAuth, async (req, res, next) => {
  try {
    const topics     = (req.query.topics || '').split(',').filter(Boolean);
    const difficulty = req.query.difficulty || 'any';

    if (!topics.length) return res.status(400).json({ error: 'At least one topic required' });

    const pool = await getQuestionPool(topics, difficulty);

    // Strip correct answers for preview
    const safe = pool.map(({ correct: _c, explanation: _e, ...q }) => q);
    res.json({ count: safe.length, questions: safe });
  } catch (err) { next(err); }
});

export default router;
