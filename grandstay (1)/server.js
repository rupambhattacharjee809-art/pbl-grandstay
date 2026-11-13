import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './backend/db.js';
import { seedDatabase } from './backend/seed.js';
import authRoutes from './backend/routes/auth.js';
import propertyRoutes from './backend/routes/properties.js';
import tourRoutes from './backend/routes/tours.js';
import offerRoutes from './backend/routes/offers.js';
import bookingRoutes from './backend/routes/bookings.js';
import wishlistRoutes from './backend/routes/wishlist.js';
import { Property } from './backend/models/Property.js';
import { Booking } from './backend/models/Booking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  await connectDB();
  await seedDatabase();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    const [propertyCount, bookingCount] = await Promise.all([
      Property.countDocuments(),
      Booking.countDocuments(),
    ]);
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      engine: 'mongodb',
      collections: {
        properties: propertyCount,
        bookings: bookingCount,
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/tours', tourRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/wishlist', wishlistRoutes);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GrandStay Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GrandStay Server] Fatal startup error:', err);
  process.exit(1);
});
