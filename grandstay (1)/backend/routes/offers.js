import express from 'express';
import { Offer } from '../models/Offer.js';

const router = express.Router();

export async function evaluatePromoCode({ code, nights, checkInDate, subtotal, category }) {
  if (!code || !String(code).trim()) {
    return { valid: false, discountAmount: 0, message: 'No promo code provided.' };
  }

  const normalized = String(code).trim().toUpperCase();
  const offer = await Offer.findOne({ code: normalized, active: true }).lean();
  if (!offer) {
    return { valid: false, discountAmount: 0, message: `Promo code "${normalized}" was not found.` };
  }

  if (nights < offer.minNights) {
    return {
      valid: false,
      discountAmount: 0,
      message: `${offer.code} requires a minimum stay of ${offer.minNights} nights.`,
    };
  }

  if (offer.minAdvanceDays > 0 && checkInDate) {
    const msAhead = new Date(checkInDate).getTime() - Date.now();
    const daysAhead = Math.ceil(msAhead / 86400000);
    if (daysAhead < offer.minAdvanceDays) {
      return {
        valid: false,
        discountAmount: 0,
        message: `${offer.code} requires booking at least ${offer.minAdvanceDays} days before check-in.`,
      };
    }
  }

  if (offer.category === 'Private Villas' && category !== 'villa') {
    return {
      valid: false,
      discountAmount: 0,
      message: `${offer.code} is valid exclusively for Private Villa stays.`,
    };
  }

  let discountAmount = 0;
  if (offer.discountType === 'percent') {
    discountAmount = Math.round((subtotal * offer.discountValue) / 100);
  } else if (offer.discountType === 'flat') {
    discountAmount = Math.min(subtotal, offer.discountValue);
  }

  return {
    valid: true,
    offer,
    discountAmount,
    message: `${offer.code} applied — ${offer.discountLabel}`,
  };
}

router.get('/', async (_req, res) => {
  try {
    const offers = await Offer.find({ active: true }).sort({ createdAt: 1 }).lean();
    return res.json({ offers });
  } catch (err) {
    console.error('[Offers List]', err);
    return res.status(500).json({ error: 'Failed to load exclusive offers.' });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { code, nights = 1, checkInDate, subtotal = 0, category = 'hotel' } = req.body || {};
    const result = await evaluatePromoCode({
      code,
      nights: Number(nights),
      checkInDate,
      subtotal: Number(subtotal),
      category,
    });
    if (!result.valid) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[Validate Offer]', err);
    return res.status(500).json({ error: 'Failed to validate promo code.' });
  }
});

export default router;
