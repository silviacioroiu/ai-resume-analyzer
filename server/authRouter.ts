/**
 * Authentication Router - JWT-based auth endpoints
 * Handles user registration, login, and profile management
 */

import { Router } from "express";
import { z } from "zod";
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateJWT,
  AuthRequest,
} from "./auth";
import {
  createUser,
  getUserByEmail,
  getUserById,
  touchLastSignedIn,
} from "./db";

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await createUser({
      email,
      password: hashedPassword,
      name: name || null,
      role: "user",
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return user data (without password) and token
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await touchLastSignedIn(user.id);

    // Return user data (without password) and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (protected route)
 */
router.get("/me", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data without password
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, but endpoint for consistency)
 */
router.post("/logout", (req, res) => {
  // In JWT, logout is typically handled client-side by removing the token
  // This endpoint is here for API consistency and future extensions (e.g., token blacklisting)
  res.json({ message: "Logged out successfully" });
});

export default router;
