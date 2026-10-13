import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { dbStore } from '../db/store.js';
import { hashPassword, comparePassword, generateToken } from '../utils/tokens.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  role: z.enum(['lead_architect', 'researcher', 'compliance_officer', 'executive']).optional().default('lead_architect'),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// -----------------------------------------------------------------------------
// POST /api/auth/register
// -----------------------------------------------------------------------------
router.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, fullName, role } = req.body;

      // 1. Check if user already exists
      const existingUser = await dbStore.findUserByEmail(email);
      if (existingUser) {
        throw new AppError('An account with this email address already exists.', 409);
      }

      // 2. Hash password securely
      const passwordHash = await hashPassword(password);

      // 3. Create user in database
      const newUser = await dbStore.createUser({
        email,
        passwordHash,
        fullName,
        role,
      });

      // 4. Issue JWT access token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      res.status(201).json({
        success: true,
        message: 'Account successfully registered.',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // 1. Locate user by email
      const user = await dbStore.findUserByEmail(email);
      if (!user) {
        throw new AppError('Invalid email or password credentials provided.', 401);
      }

      // 2. Verify password with bcrypt
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Invalid email or password credentials provided.', 401);
      }

      // 3. Issue JWT access token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// -----------------------------------------------------------------------------
// GET /api/auth/me (Protected Profile Route)
// -----------------------------------------------------------------------------
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await dbStore.findUserById(req.user!.userId);
    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
