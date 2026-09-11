import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/routes";
import contactRoutes from "./modules/contacts/routes";
import organizationRoutes from "./modules/organizations/routes";
import eventRoutes from "./modules/events/routes";
import documentRoutes from "./modules/documents/routes";
import auditRoutes from "./modules/audit/routes";
import searchRoutes from "./modules/search/routes";
import userRoutes from "./modules/users/routes";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/contacts", contactRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/users", userRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
