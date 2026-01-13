import "dotenv/config";
import express from "express";
import cors from "cors";
import { validateAcuityCredentials } from "./lib/acuity-client";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleSignup, handleLogout } from "./routes/auth";
import { handleGetProjects, handleGetProjectDetail } from "./routes/projects";
import { handleSubmitChange, handleGetChanges } from "./routes/changes";
import {
  handleGetProfile,
  handleUpdateProfile,
  handleGetSubscription,
  handleGetTeamMembers,
  handleInviteUser,
  handleGetInvites,
  handleUpdatePermissions,
  handleRemoveTeamMember,
} from "./routes/account";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/logout", handleLogout);

  // Projects routes
  app.get("/api/projects", handleGetProjects);
  app.get("/api/projects/:id", handleGetProjectDetail);

  // Changes routes
  app.post("/api/changes", handleSubmitChange);
  app.get("/api/changes", handleGetChanges);

  // Account routes
  app.get("/api/account/profile", handleGetProfile);
  app.put("/api/account/profile", handleUpdateProfile);
  app.get("/api/account/subscription", handleGetSubscription);

  // Team routes
  app.get("/api/team/members", handleGetTeamMembers);
  app.post("/api/team/invite", handleInviteUser);
  app.get("/api/team/invites", handleGetInvites);
  app.put("/api/team/members/:id/permissions", handleUpdatePermissions);
  app.delete("/api/team/members/:id", handleRemoveTeamMember);

  return app;
}
