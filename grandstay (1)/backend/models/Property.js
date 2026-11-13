import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pricePerNight: { type: Number, required: true },
    maxGuests: { type: Number, required: true, default: 2 },
    bedType: { type: String, required: true },
    sizeSqFt: { type: Number, required: true },
    totalUnits: { type: Number, required: true, default: 4 },
    description: { type: String, required: true },
    perks: [{ type: String }],
  },
  { _id: false }
);

const landmarkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    distanceKm: { type: Number, required: true },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['hotel', 'villa'],
      required: true,
      index: true,
    },
    propertyType: { type: String, required: true },
    destination: { type: String, required: true, index: true },
    location: { type: String, required: true },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    pricePerNight: { type: Number, required: true, index: true },
    currency: { type: String, default: '₹' },
    starRating: { type: Number, default: 5 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    maxGuests: { type: Number, default: 4 },
    bedrooms: { type: Number, default: 1 },
    amenities: [{ type: String }],
    roomTypes: [roomTypeSchema],
    nearbyLandmarks: [landmarkSchema],
    distanceFromCityCenterKm: { type: Number, default: 2.0 },
    bookingConditions: {
      freeCancellation: { type: Boolean, default: true },
      payAtHotel: { type: Boolean, default: true },
    },
    accessibilityFeatures: [{ type: String }],
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);
