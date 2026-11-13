import express from 'express';
import mongoose from 'mongoose';
import { Wishlist } from '../models/Wishlist.js';
import { Property } from '../models/Property.js';
import { optionalAuth, getOwnerKey } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const ownerKey = getOwnerKey(req);
    const wishlist = await Wishlist.findOne({ ownerKey }).populate('propertyIds').lean();
    const properties = wishlist?.propertyIds || [];
    return res.json({
      propertyIds: properties.map((p) => p._id.toString()),
      properties,
    });
  } catch (err) {
    console.error('[Wishlist Get]', err);
    return res.status(500).json({ error: 'Failed to load saved stays.' });
  }
});

router.post('/toggle', optionalAuth, async (req, res) => {
  try {
    const { propertyId } = req.body || {};
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: 'Valid propertyId is required.' });
    }

    const exists = await Property.exists({ _id: propertyId });
    if (!exists) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const ownerKey = getOwnerKey(req);
    let wishlist = await Wishlist.findOne({ ownerKey });
    if (!wishlist) {
      wishlist = new Wishlist({ ownerKey, propertyIds: [] });
    }

    const idStr = String(propertyId);
    const index = wishlist.propertyIds.findIndex((id) => id.toString() === idStr);
    let saved = false;
    if (index >= 0) {
      wishlist.propertyIds.splice(index, 1);
      saved = false;
    } else {
      wishlist.propertyIds.push(propertyId);
      saved = true;
    }

    await wishlist.save();
    const populated = await Wishlist.findOne({ ownerKey }).populate('propertyIds').lean();

    return res.json({
      saved,
      propertyIds: (populated?.propertyIds || []).map((p) => p._id.toString()),
      properties: populated?.propertyIds || [],
    });
  } catch (err) {
    console.error('[Wishlist Toggle]', err);
    return res.status(500).json({ error: 'Failed to update saved stays.' });
  }
});

export default router;
