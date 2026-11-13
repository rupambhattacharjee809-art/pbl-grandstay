import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { optionalAuth, signToken } from '../middleware/auth.js';

const router = express.Router();

function setAuthCookie(res, token) {
  res.cookie('grandstay_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        error: 'Name, valid email, and a password of at least 6 characters are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone?.trim() || '',
      loyaltyTier: 'Silver Member',
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        loyaltyTier: user.loyaltyTier,
      },
    });
  } catch (err) {
    console.error('[Auth Register]', err);
    return res.status(500).json({ error: 'Unable to create account right now.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        loyaltyTier: user.loyaltyTier,
      },
    });
  } catch (err) {
    console.error('[Auth Login]', err);
    return res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

router.get('/me', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      loyaltyTier: req.user.loyaltyTier,
    },
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('grandstay_token', { path: '/' });
  return res.json({ ok: true });
});

export default router;
