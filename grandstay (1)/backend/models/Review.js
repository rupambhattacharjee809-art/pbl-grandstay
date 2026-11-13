import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: { type: String, required: true, trim: true },
    authorCity: { type: String, default: 'Mumbai' },
    stayType: { type: String, default: 'Leisure Stay' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    verifiedStay: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
