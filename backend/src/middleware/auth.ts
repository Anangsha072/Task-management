// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { prisma } from "../lib/prisma";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET!;

interface JwtPayload {
  userId: string;
  email: string;
}

// Extend Request inline
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return next(new AppError("Unauthorized", 401));

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return next(new AppError("Unauthorized", 401));

    req.user = { id: user.id, email: user.email };
    next();
  } catch {
    return next(new AppError("Unauthorized", 401));
  }
}
