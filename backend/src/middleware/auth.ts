// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "./errorHandler";

// Extend Express Request to include `user`
export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

// Middleware to require authentication
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authorization header missing", 401));
    }

    const token = authHeader.split(" ")[1];

    if (!token) return next(new AppError("Token missing", 401));

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new AppError("JWT secret not configured", 500);

    let payload: any;
    try {
      payload = jwt.verify(token, secret) as { userId: string; email: string };
    } catch (err) {
      return next(new AppError("Invalid or expired token", 401));
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new AppError("User not found", 401));

    // Attach user to request
    req.user = { id: user.id, email: user.email };

    next();
  } catch (err) {
    next(err);
  }
};
