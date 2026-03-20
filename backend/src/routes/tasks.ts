// src/routes/tasks.ts
import { Router, Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

const statusValues = ["pending", "in_progress", "completed"] as const;

tasksRouter.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status").optional().isIn(statusValues),
    query("search").optional().isString().trim(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const userId = req.user!.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as string | undefined;
      const search = (req.query.search as string)?.trim();

      const where: any = { userId };
      if (status) where.status = status;
      if (search) where.title = { contains: search };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.task.count({ where }),
      ]);

      res.json({ tasks, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (e) {
      next(e);
    }
  }
);
