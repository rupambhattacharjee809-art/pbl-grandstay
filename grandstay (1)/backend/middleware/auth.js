import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'grandstay-dev-secret-change-in-production';

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)grandstay_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash').lean();
    req.user = user || null;
  } catch {
    req.user = null;
  }
  return next();
}

export async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    return next();
  });
}

export function getOwnerKey(req) {
  if (req.user?._id) {
    return `user:${req.user._id.toString()}`;
  }
  const guestSession = req.headers['x-guest-session'];
  if (guestSession && typeof guestSession === 'string' && guestSession.trim()) {
    return `guest:${guestSession.trim()}`;
  }
  return 'guest:default';
}
