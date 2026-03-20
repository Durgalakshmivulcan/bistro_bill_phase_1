import http from 'http';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';
import { ApiResponse, ApiError } from './types';
import {
  connectDatabase,
  ensureProductCatalogColumns,
  ensureTaxGroupMetaColumns,
  isDatabaseHealthy,
} from './services/db.service';
// import { cacheService } from './services/cache.service'; // Uncomment when Redis is configured
import { initializeWebSocket } from './websocket/websocket.server';
import authRoutes from './routes/auth.routes';
import superAdminRoutes from './routes/superAdmin.routes';
import catalogRoutes from './routes/catalog.routes';
import inventoryRoutes from './routes/inventory.routes';
import resourceRoutes from './routes/resource.routes';
import customerRoutes from './routes/customer.routes';
import marketingRoutes from './routes/marketing.routes';
import publicRoutes from './routes/public.routes';
import posRoutes from './routes/pos.routes';
import kdsRoutes from './routes/kds.routes';
import settingsRoutes from './routes/settings.routes';
import reportsRoutes from './routes/reports.routes';
import dashboardRoutes from './routes/dashboard.routes';
import onlineOrderRoutes from './routes/onlineOrder.routes';
import blogRoutes from './routes/blog.routes';
import paymentRoutes from './routes/payment.routes';
import reservationRoutes from './routes/reservation.routes';
import loyaltyRoutes from './routes/loyalty.routes';
import reviewRoutes from './routes/review.routes';
import integrationRoutes from './routes/integration.routes';
import businessOwnerRoutes from "./routes/businessOwner.routes";


// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ASSETS_DIR = path.resolve(process.cwd(), 'src/assets');
const LEGACY_ASSETS_DIR = path.resolve(__dirname, '../../src/assets');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('x-bistro-server', 'workspace-d-bistro-bill');
  next();
});
app.use('/assets', express.static(FRONTEND_ASSETS_DIR));
app.use('/assets', express.static(LEGACY_ASSETS_DIR));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await isDatabaseHealthy();
  const response: ApiResponse<{ status: string; database: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'healthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
    message: 'Server is running',
  };
  res.json(response);
});

// API version prefix
app.get('/api/v1', (_req: Request, res: Response) => {
  const response: ApiResponse<{ version: string; name: string }> = {
    success: true,
    data: {
      version: '1.0.0',
      name: 'Bistro Bill API',
    },
    message: 'Welcome to Bistro Bill API',
  };
  res.json(response);
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/marketing', marketingRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/kds', kdsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/webhooks', onlineOrderRoutes.webhookRouter);
app.use('/api/v1/pos', onlineOrderRoutes.managementRouter);
app.use("/api/v1/business-owner", businessOwnerRoutes);
// 404 handler
app.use((_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  };
  res.status(404).json(response);
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);

  const errorResponse: ApiError = {
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  };

  const response: ApiResponse = {
    success: false,
    error: errorResponse,
  };

  res.status(500).json(response);
});

// Create HTTP server for Express + WebSocket
const httpServer = http.createServer(app);

// Start server
async function startServer() {
  try {
    // Ensure local catalog upload directories exist.
    await Promise.all([
      fs.mkdir(path.resolve(FRONTEND_ASSETS_DIR, 'catalog/category'), { recursive: true }),
      fs.mkdir(path.resolve(FRONTEND_ASSETS_DIR, 'catalog/subcategory'), { recursive: true }),
      fs.mkdir(path.resolve(FRONTEND_ASSETS_DIR, 'catalog/brand'), { recursive: true }),
      fs.mkdir(path.resolve(FRONTEND_ASSETS_DIR, 'catalog/menu'), { recursive: true }),
      fs.mkdir(path.resolve(FRONTEND_ASSETS_DIR, 'catalog/tags'), { recursive: true }),
      fs.mkdir(path.resolve(FRONTEND_ASSETS_DIR, 'catalog/products'), { recursive: true }),
    ]);

    // Connect to database
    await connectDatabase();
    await ensureProductCatalogColumns();
    await ensureTaxGroupMetaColumns();

    // Connect to Redis cache (optional - app continues without cache if Redis unavailable)
    // Temporarily disabled - uncomment when Redis is available
    // await cacheService.connect();

    // Initialize WebSocket server on /ws path
    initializeWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`WebSocket available on ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
