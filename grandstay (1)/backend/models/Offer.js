import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    discountLabel: { type: String, required: true },
    discountType: {
      type: String,
      enum: ['percent', 'flat', 'perk'],
      required: true,
    },
    discountValue: { type: Number, required: true, default: 0 },
    minNights: { type: Number, default: 1 },
    minAdvanceDays: { type: Number, default: 0 },
    category: { type: String, default: 'All Stays' },
    description: { type: String, required: true },
    validity: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);
