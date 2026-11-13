import express from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Property } from '../models/Property.js';
import { Tour } from '../models/Tour.js';
import { optionalAuth } from '../middleware/auth.js';
import { evaluatePromoCode } from './offers.js';

const router = express.Router();

function generateReferenceNumber() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `GS-${year}-${num}`;
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { email, reference } = req.query;
    const guestSessionId = req.headers['x-guest-session'];

    if (reference && String(reference).trim()) {
      const booking = await Booking.findOne({
        referenceNumber: String(reference).trim().toUpperCase(),
      }).lean();
      return res.json({ bookings: booking ? [booking] : [] });
    }

    const orClauses = [];
    if (req.user?._id) {
      orClauses.push({ userId: req.user._id });
      orClauses.push({ guestEmail: req.user.email.toLowerCase() });
    }
    if (email && String(email).trim()) {
      orClauses.push({ guestEmail: String(email).trim().toLowerCase() });
    }
    if (guestSessionId && String(guestSessionId).trim()) {
      orClauses.push({ guestSessionId: String(guestSessionId).trim() });
    }

    if (orClauses.length === 0) {
      return res.json({ bookings: [] });
    }

    const bookings = await Booking.find({ $or: orClauses })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ bookings });
  } catch (err) {
    console.error('[Bookings List]', err);
    return res.status(500).json({ error: 'Failed to load reservations.' });
  }
});

router.get('/:ref', async (req, res) => {
  try {
    const ref = String(req.params.ref).trim();
    const query = mongoose.Types.ObjectId.isValid(ref)
      ? { $or: [{ _id: ref }, { referenceNumber: ref.toUpperCase() }] }
      : { referenceNumber: ref.toUpperCase() };

    const booking = await Booking.findOne(query).lean();
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }
    return res.json({ booking });
  } catch (err) {
    console.error('[Booking Detail]', err);
    return res.status(500).json({ error: 'Failed to load reservation.' });
  }
});

router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      propertyId,
      roomType,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      roomsCount = 1,
      guestName,
      guestEmail,
      guestPhone,
      tourSlugs = [],
      promoCode = '',
      paymentMethod = 'Pay at Hotel',
      specialRequests = '',
    } = req.body || {};

    if (!propertyId || !roomType || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Property, room category, and stay dates are required.' });
    }

    if (!guestName?.trim() || !guestEmail?.trim() || !guestPhone?.trim()) {
      return res.status(400).json({ error: 'Guest name, email, and phone number are required.' });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
    }

    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const roomsQty = Math.max(1, Number(roomsCount));
    const totalGuests = Math.max(1, Number(adults) + Number(children));

    const propertyQuery = mongoose.Types.ObjectId.isValid(propertyId)
      ? { _id: propertyId }
      : { slug: propertyId };
    const property = await Property.findOne(propertyQuery).lean();
    if (!property) {
      return res.status(404).json({ error: 'Selected property was not found.' });
    }

    const selectedRoom = property.roomTypes.find((r) => r.name === roomType);
    if (!selectedRoom) {
      return res.status(400).json({ error: 'Selected room category does not exist.' });
    }

    const overlapping = await Booking.find({
      propertyId: property._id,
      roomType: selectedRoom.name,
      status: { $ne: 'Cancelled' },
      checkIn: { $lt: end },
      checkOut: { $gt: start },
    }).lean();

    const bookedUnits = overlapping.reduce((sum, b) => sum + (b.roomsCount || 1), 0);
    const availableUnits = Math.max(0, selectedRoom.totalUnits - bookedUnits);
    if (availableUnits < roomsQty) {
      return res.status(409).json({
        error: `Only ${availableUnits} unit(s) of "${selectedRoom.name}" available for those dates.`,
      });
    }

    const roomSubtotal = selectedRoom.pricePerNight * nights * roomsQty;

    let tourAddOns = [];
    let toursSubtotal = 0;
    if (Array.isArray(tourSlugs) && tourSlugs.length > 0) {
      const tours = await Tour.find({ slug: { $in: tourSlugs } }).lean();
      tourAddOns = tours.map((t) => {
        const totalPrice = t.price * totalGuests;
        toursSubtotal += totalPrice;
        return {
          tourSlug: t.slug,
          title: t.title,
          pricePerGuest: t.price,
          guests: totalGuests,
          totalPrice,
        };
      });
    }

    let appliedPromo = '';
    let discountAmount = 0;
    if (promoCode && promoCode.trim()) {
      const promoEval = await evaluatePromoCode({
        code: promoCode,
        nights,
        checkInDate: start,
        subtotal: roomSubtotal,
        category: property.category,
      });
      if (!promoEval.valid) {
        return res.status(400).json({ error: promoEval.message });
      }
      appliedPromo = promoEval.offer.code;
      discountAmount = promoEval.discountAmount;
    }

    const taxableAmount = Math.max(0, roomSubtotal - discountAmount + toursSubtotal);
    const taxesAndFees = Math.round(taxableAmount * 0.12);
    const totalAmount = taxableAmount + taxesAndFees;

    let referenceNumber = generateReferenceNumber();
    while (await Booking.exists({ referenceNumber })) {
      referenceNumber = generateReferenceNumber();
    }

    const guestSessionId =
      typeof req.headers['x-guest-session'] === 'string'
        ? req.headers['x-guest-session'].trim()
        : '';

    const booking = await Booking.create({
      referenceNumber,
      userId: req.user?._id || null,
      guestSessionId,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestPhone: guestPhone.trim(),
      propertyId: property._id,
      propertySlug: property.slug,
      propertyName: property.name,
      propertyDestination: property.destination,
      propertyLocation: property.location,
      propertyImage: property.image,
      roomType: selectedRoom.name,
      nightlyRate: selectedRoom.pricePerNight,
      checkIn: start,
      checkOut: end,
      nights,
      adults: Number(adults),
      children: Number(children),
      roomsCount: roomsQty,
      tourAddOns,
      promoCode: appliedPromo,
      roomSubtotal,
      toursSubtotal,
      discountAmount,
      taxesAndFees,
      totalAmount,
      paymentMethod,
      specialRequests: specialRequests?.trim() || '',
      status: 'Confirmed',
    });

    return res.status(201).json({ booking });
  } catch (err) {
    console.error('[Create Booking]', err);
    return res.status(500).json({ error: 'Unable to complete reservation right now.' });
  }
});

router.patch('/:id/status', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['Confirmed', 'Checked In', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { referenceNumber: String(id).toUpperCase() };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    booking.status = status;
    await booking.save();
    return res.json({ booking });
  } catch (err) {
    console.error('[Update Booking Status]', err);
    return res.status(500).json({ error: 'Failed to update reservation status.' });
  }
});

export default router;
