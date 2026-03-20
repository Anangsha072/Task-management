import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../lib/prisma";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

const statusValues = ["pending", "in_progress", "completed"];

tasksRouter.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status").optional().isIn(statusValues),
    query("search").optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const userId = (req as any).user.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as string | undefined;
      const search = (req.query.search as string)?.trim();

      const where: any = { userId };
      if (status) where.status = status;
      if (search) where.title = { contains: search };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.task.count({ where }),
      ]);

      return res.json({
        tasks,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (e) {
      next(e);
    }
  }
);

tasksRouter.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").optional().trim(),
    body("status").optional().isIn(statusValues),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const userId = (req as any).user.id;
      const { title, description, status } = req.body;
      const task = await prisma.task.create({
        data: {
          title,
          description: description || null,
          status: status || "pending",
          userId,
        },
      });
      return res.status(201).json(task);
    } catch (e) {
      next(e);
    }
  }
);

tasksRouter.get(
  "/:id",
  [param("id").notEmpty()],
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const task = await prisma.task.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!task) return next(new AppError("Task not found", 404));
      return res.json(task);
    } catch (e) {
      next(e);
    }
  }
);

tasksRouter.patch(
  "/:id",
  [
    param("id").notEmpty(),
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim(),
    body("status").optional().isIn(statusValues),
    body("completed").optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const userId = (req as any).user.id;
      const task = await prisma.task.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!task) return next(new AppError("Task not found", 404));
      const { title, description, status, completed } = req.body;
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(completed !== undefined && { completed }),
        },
      });
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

tasksRouter.delete(
  "/:id",
  [param("id").notEmpty()],
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const task = await prisma.task.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!task) return next(new AppError("Task not found", 404));
      await prisma.task.delete({ where: { id: task.id } });
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

tasksRouter.patch(
  "/:id/toggle",
  [param("id").notEmpty()],
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const task = await prisma.task.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!task) return next(new AppError("Task not found", 404));
      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { completed: !task.completed },
      });
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);
