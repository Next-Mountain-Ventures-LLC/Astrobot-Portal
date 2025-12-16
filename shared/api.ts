/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Authentication Types
 */
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  name: string;
  token: string;
}

/**
 * User Types
 */
export type UserRole = "admin" | "member" | "viewer";

export type Permission =
  | "view_projects"
  | "edit_projects"
  | "submit_changes"
  | "manage_team"
  | "view_reports";

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  createdAt: string;
  role: UserRole;
  permissions: Permission[];
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  joinedAt: string;
  status: "active" | "invited" | "pending";
}

export interface UserInvite {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "declined";
}

/**
 * Project Types
 */
export interface Project {
  id: string;
  name: string;
  status: "design" | "development" | "review" | "launched";
  progress: number;
  description: string;
  startDate: string;
  launchDate?: string;
  userId: string;
  websiteUrl?: string;
}

export interface ProjectDetail extends Project {
  timeline: Array<{
    phase: string;
    completed: boolean;
    date?: string;
  }>;
}

/**
 * Change Request Types
 */
export interface ChangeRequest {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: "content" | "design" | "feature" | "bug" | "other";
  priority: "low" | "medium" | "high";
  status: "submitted" | "in-progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

/**
 * Account Types
 */
export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: "active" | "cancelled" | "expired";
  renewalDate: string;
}
