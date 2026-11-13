import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    ownerKey: { type: String, required: true, unique: true, index: true },
    propertyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  },
  { timestamps: true }
);

export const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
