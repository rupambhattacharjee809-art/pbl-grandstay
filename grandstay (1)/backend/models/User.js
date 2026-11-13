import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    loyaltyTier: {
      type: String,
      enum: ['Silver Member', 'Gold Member', 'Platinum Concierge'],
      default: 'Silver Member',
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
