/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [auth]
 *     summary: User login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
import { NextRequest } from 'next/server';
import { container } from '@/infrastructure/di/container';

// POST /api/auth/login - Login de usuario con JWT
export async function POST(request: NextRequest) {
  const authController = container.getAuthController();
  return await authController.login(request);
}
