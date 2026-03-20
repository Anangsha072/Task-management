// src/lib/jwt.ts
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { prisma } from "./prisma";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

const signOptions: SignOptions = { expiresIn: ACCESS_EXPIRY };

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, signOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

export async function createRefreshTokenRecord(userId: string): Promise<string> {
  const payload: TokenPayload = { userId, email: "" };
  const token = signRefreshToken(payload);
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded.exp) throw new Error("Invalid token expiry");

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt: new Date(decoded.exp * 1000) },
  });

  return token;
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function isValidRefreshToken(token: string) {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  return !!record && record.expiresAt >= new Date();
}
