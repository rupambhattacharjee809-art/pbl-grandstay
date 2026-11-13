import express from 'express';
import mongoose from 'mongoose';
import { Property } from '../models/Property.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      category,
      destination,
      search,
      minPrice,
      maxPrice,
      guests,
      freeCancellation,
      payAtHotel,
      amenity,
      sort = 'recommended',
    } = req.query;

    const filter = {};

    if (category && ['hotel', 'villa'].includes(String(category))) {
      filter.category = String(category);
    }

    if (destination && destination !== 'All') {
      filter.destination = new RegExp(`^${String(destination).trim()}$`, 'i');
    }

    if (search && String(search).trim()) {
      const q = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { name: q },
        { destination: q },
        { location: q },
        { propertyType: q },
        { description: q },
      ];
    }

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }

    if (guests) {
      filter.maxGuests = { $gte: Number(guests) };
    }

    if (freeCancellation === 'true') {
      filter['bookingConditions.freeCancellation'] = true;
    }

    if (payAtHotel === 'true') {
      filter['bookingConditions.payAtHotel'] = true;
    }

    if (amenity) {
      filter.amenities = { $in: [String(amenity)] };
    }

    let sortObj = { featured: -1, rating: -1 };
    if (sort === 'price_asc') sortObj = { pricePerNight: 1 };
    else if (sort === 'price_desc') sortObj = { pricePerNight: -1 };
    else if (sort === 'rating') sortObj = { rating: -1, reviewCount: -1 };

    const properties = await Property.find(filter).sort(sortObj).lean();
    return res.json({ properties });
  } catch (err) {
    console.error('[Properties List]', err);
    return res.status(500).json({ error: 'Failed to load properties.' });
  }
});

router.get('/destinations', async (_req, res) => {
  try {
    const destinations = await Property.distinct('destination');
    return res.json({ destinations: destinations.sort() });
  } catch (err) {
    console.error('[Destinations]', err);
    return res.status(500).json({ error: 'Failed to load destinations.' });
  }
});

router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { checkIn, checkOut } = req.query;

    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const property = await Property.findOne(query).lean();
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const reviews = await Review.find({ propertyId: property._id })
      .sort({ createdAt: -1 })
      .lean();

    let roomAvailability = property.roomTypes.map((rt) => ({
      ...rt,
      availableUnits: rt.totalUnits,
    }));

    if (checkIn && checkOut) {
      const start = new Date(String(checkIn));
      const end = new Date(String(checkOut));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
        const overlapping = await Booking.find({
          propertyId: property._id,
          status: { $ne: 'Cancelled' },
          checkIn: { $lt: end },
          checkOut: { $gt: start },
        }).lean();

        roomAvailability = property.roomTypes.map((rt) => {
          const bookedUnits = overlapping
            .filter((b) => b.roomType === rt.name)
            .reduce((sum, b) => sum + (b.roomsCount || 1), 0);
          return {
            ...rt,
            availableUnits: Math.max(0, rt.totalUnits - bookedUnits),
          };
        });
      }
    }

    return res.json({
      property: {
        ...property,
        roomTypes: roomAvailability,
      },
      reviews,
    });
  } catch (err) {
    console.error('[Property Detail]', err);
    return res.status(500).json({ error: 'Failed to load property details.' });
  }
});

router.post('/:idOrSlug/reviews', optionalAuth, async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { authorName, authorCity, stayType, rating, title, comment } = req.body || {};

    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const property = await Property.findOne(query);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const numericRating = Number(rating);
    if (
      !title?.trim() ||
      !comment?.trim() ||
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        error: 'Please provide a rating (1-5), headline, and review comment.',
      });
    }

    const review = await Review.create({
      propertyId: property._id,
      userId: req.user?._id || null,
      authorName: authorName?.trim() || req.user?.name || 'Verified Guest',
      authorCity: authorCity?.trim() || 'India',
      stayType: stayType?.trim() || 'Leisure Stay',
      rating: numericRating,
      title: title.trim(),
      comment: comment.trim(),
      verifiedStay: true,
    });

    const stats = await Review.aggregate([
      { $match: { propertyId: property._id } },
      {
        $group: {
          _id: '$propertyId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      property.rating = Number(stats[0].avgRating.toFixed(1));
      property.reviewCount = stats[0].count;
      await property.save();
    }

    return res.status(201).json({
      review,
      propertyRating: property.rating,
      reviewCount: property.reviewCount,
    });
  } catch (err) {
    console.error('[Create Review]', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});

export default router;
