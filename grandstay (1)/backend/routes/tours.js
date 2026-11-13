import express from 'express';
import { Tour } from '../models/Tour.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { destination } = req.query;
    const filter = {};
    if (destination && destination !== 'All') {
      filter.destination = new RegExp(`^${String(destination).trim()}$`, 'i');
    }
    const tours = await Tour.find(filter).sort({ createdAt: 1 }).lean();
    return res.json({ tours });
  } catch (err) {
    console.error('[Tours List]', err);
    return res.status(500).json({ error: 'Failed to load curated tours.' });
  }
});

export default router;
