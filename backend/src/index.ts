import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { tasksRouter } from "./routes/tasks";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://your-frontend-url.onrender.com" // 👈 PUT YOUR FRONTEND URL
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ROUTES
app.get("/", (_req, res) => {
  res.send("Task Management API is running 🚀");
});

app.use("/auth", authRouter);
app.use("/tasks", tasksRouter);

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// ERROR HANDLER
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
