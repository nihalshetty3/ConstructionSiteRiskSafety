import express from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import dayjs from "dayjs";

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
});

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { email, password, fullName } = validated;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create user
    const user = new User({
      email,
      password,
      fullName,
    });

    // Generate OTP
    const otpCode = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      email: user.email,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const validated = verifyEmailSchema.parse(req.body);
    const { email, otp } = validated;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.emailVerified = true;
    user.emailVerificationOTP = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
    console.error("Verify email error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        requiresVerification: true,
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id.toString() });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Store refresh token
    const expiresAt = dayjs().add(7, "day").toDate();
    const userAgent = req.headers["user-agent"] || "unknown";
    user.addRefreshToken(refreshToken, expiresAt, userAgent);
    user.cleanExpiredTokens();
    await user.save();

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Check if refresh token exists in user's token list
    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({ error: "Refresh token not found or expired" });
    }

    // Generate new access token
    const accessToken = generateAccessToken({ userId: user._id.toString() });

    res.json({ accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// POST /auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken && req.user) {
      req.user.removeRefreshToken(refreshToken);
      await req.user.save();
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// GET /auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({
    id: req.user._id,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
    emailVerified: req.user.emailVerified,
  });
});

// GET /auth/secret (protected by ADMIN or SAFETY_OFFICER role)
router.get("/secret", requireAuth, requireRole("ADMIN", "SAFETY_OFFICER"), (req, res) => {
  res.json({
    message: "This is a protected route for ADMIN and SAFETY_OFFICER roles",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

export default router;

