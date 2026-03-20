import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { prisma } from "../lib/prisma";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return next(new AppError("Unauthorized", 401));
    (req as any).user = user; // attach user to request
    next();
  } catch {
    return next(new AppError("Unauthorized", 401));
  }
}
