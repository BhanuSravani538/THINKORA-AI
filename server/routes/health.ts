import { Router, Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store.js';
import { env, isSupabaseConfigured } from '../config/env.js';

const router = Router();
const startTime = Date.now();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    const dbStatus = await dbStore.testConnection();

    res.status(200).json({
      status: 'healthy',
      service: 'THINKORA Decision Support Backend API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: `${uptimeSeconds}s`,
      timestamp: new Date().toISOString(),
      database: {
        provider: dbStatus.provider === 'supabase' ? 'Supabase PostgreSQL' : 'Local Persistent Storage (File-backed Fallback)',
        isSupabaseConnected: dbStatus.connected && dbStatus.provider === 'supabase',
        isSupabaseConfigured,
        details: dbStatus.details,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryRssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        memoryHeapMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
