import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  createRefreshTokenRecord,
  verifyRefreshToken,
  revokeRefreshToken,
  isValidRefreshToken,
} from "../lib/jwt";
import { AppError } from "../middleware/errorHandler";

export const authRouter = Router();

// Register
authRouter.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { email, password } = req.body;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, createdAt: true },
      });
      const accessToken = signAccessToken({ userId: user.id, email: user.email });
      const refreshToken = await createRefreshTokenRecord(user.id);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(201).json({
        user: { id: user.id, email: user.email },
        accessToken,
        expiresIn: 900,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Login
authRouter.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const accessToken = signAccessToken({ userId: user.id, email: user.email });
      const refreshToken = await createRefreshTokenRecord(user.id);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({
        user: { id: user.id, email: user.email },
        accessToken,
        expiresIn: 900,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Refresh
authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }
      if (!(await isValidRefreshToken(refreshToken))) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
      }
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return res.status(401).json({ error: "User not found" });
      const accessToken = signAccessToken({ userId: user.id, email: user.email });
      return res.json({ accessToken, expiresIn: 900 });
    } catch (e) {
      next(e);
    }
  }
);

// Logout
authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) await revokeRefreshToken(refreshToken);
      res.clearCookie("refreshToken");
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);
