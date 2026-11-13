import mongoose from 'mongoose';

const tourAddOnSchema = new mongoose.Schema(
  {
    tourSlug: { type: String, required: true },
    title: { type: String, required: true },
    pricePerGuest: { type: Number, required: true },
    guests: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestSessionId: {
      type: String,
      default: '',
      index: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    guestPhone: { type: String, required: true, trim: true },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    propertySlug: { type: String, required: true },
    propertyName: { type: String, required: true },
    propertyDestination: { type: String, required: true },
    propertyLocation: { type: String, required: true },
    propertyImage: { type: String, required: true },
    roomType: { type: String, required: true },
    nightlyRate: { type: Number, required: true },
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    nights: { type: Number, required: true, min: 1 },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    roomsCount: { type: Number, required: true, min: 1, default: 1 },
    tourAddOns: [tourAddOnSchema],
    promoCode: { type: String, default: '' },
    roomSubtotal: { type: Number, required: true },
    toursSubtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxesAndFees: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['Pay at Hotel', 'Online Card', 'UPI'],
      default: 'Pay at Hotel',
    },
    specialRequests: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Confirmed', 'Checked In', 'Cancelled'],
      default: 'Confirmed',
      index: true,
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
