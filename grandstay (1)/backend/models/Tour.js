import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    destination: { type: String, required: true, index: true },
    image: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true },
    priceType: { type: String, default: 'per person' },
    currency: { type: String, default: '₹' },
    transport: { type: String, required: true },
    guide: { type: String, required: true },
    meals: { type: String, required: true },
    itinerary: [{ type: String }],
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export const Tour = mongoose.models.Tour || mongoose.model('Tour', tourSchema);
