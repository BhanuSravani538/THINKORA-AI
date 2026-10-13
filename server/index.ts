import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import workspacesRouter from './routes/workspaces.js';
import simulatorRouter from './routes/simulator.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// -----------------------------------------------------------------------------
// Global Middlewares
// -----------------------------------------------------------------------------
app.use(
  cors({
    origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger in development
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// -----------------------------------------------------------------------------
// Route Mounts
// -----------------------------------------------------------------------------
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/simulator', simulatorRouter);

// Root entry info
app.get('/', (req, res) => {
  res.json({
    service: 'THINKORA AI REST API Service',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      workspaces: {
        list: 'GET /api/workspaces',
        create: 'POST /api/workspaces',
        detail: 'GET /api/workspaces/:id',
        documents: 'GET/POST /api/workspaces/:id/documents',
        claims: 'GET/POST /api/workspaces/:id/claims',
        scenarios: 'GET/POST /api/workspaces/:id/scenarios',
      },
      simulator: {
        evaluate: 'POST /api/simulator/evaluate',
      },
    },
  });
});

// -----------------------------------------------------------------------------
// Error Handlers
// -----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// -----------------------------------------------------------------------------
// Server Start
// -----------------------------------------------------------------------------
const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 THINKORA AI Server running on http://localhost:${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🩺 Health-Check: http://localhost:${env.PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${env.PORT}/api/auth`);
  console.log(`======================================================\n`);
});

// Graceful termination
const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down THINKORA AI server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
