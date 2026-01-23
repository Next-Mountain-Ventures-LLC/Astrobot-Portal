import "dotenv/config";
import express from "express";
import cors from "cors";
import { validateAcuityCredentials } from "./lib/acuity-client";
import { initializeSupabase } from "./supabase";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleSignup, handleLogout } from "./routes/auth";
import { handleGetProjects, handleGetProjectDetail, handleDomainChangeRequest, handleSupportTicket } from "./routes/projects";
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
import {
  handleCheckAvailability,
  handleGetAppointmentTypeDetails,
  handleGetAvailabilityDates,
  handleGetAvailabilityTimes,
  handleCreateAppointment,
  handleGetAppointmentDetails,
} from "./routes/booking";

import { initializeSupabase } from "./supabase";

export async function initializeServer() {
  // Initialize Supabase client
  await initializeSupabase();

  // Validate Acuity credentials on startup
  const credentialsValid = await validateAcuityCredentials();
  if (!credentialsValid) {
    console.warn(
      "[WARNING] Acuity credentials are not valid. Booking features may not work."
    );
  }
}

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check and debug routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      acuityConfigured: !!(
        process.env.ACUITY_USER_ID &&
        process.env.ACUITY_API_KEY &&
        process.env.ACUITY_CALENDAR_ID &&
        process.env.ACUITY_APPOINTMENT_TYPE_ID
      ),
    });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/logout", handleLogout);

  // Projects routes
  app.get("/api/projects", handleGetProjects);
  app.get("/api/projects/:id", handleGetProjectDetail);
  app.post("/api/projects/:id/domain-change-request", handleDomainChangeRequest);
  app.post("/api/projects/:id/support-ticket", handleSupportTicket);

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

  // Booking routes (Acuity Scheduling API proxy)
  app.post("/api/booking/check-availability", handleCheckAvailability);
  app.get("/api/booking/appointment-type-details", handleGetAppointmentTypeDetails);
  app.get("/api/booking/availability/dates", handleGetAvailabilityDates);
  app.get("/api/booking/availability/times", handleGetAvailabilityTimes);
  app.post("/api/booking/appointments", handleCreateAppointment);
  app.get("/api/booking/appointments/:id", handleGetAppointmentDetails);

  return app;
}
