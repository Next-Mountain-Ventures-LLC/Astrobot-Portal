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
  domain?: string; // Current domain (e.g., "example.com")
  sslStatus?: "active" | "pending" | "expired" | "none";
  uptime?: number; // Percentage (0-100)
  pageLoadTime?: number; // Milliseconds
  hostingRegion?: string; // e.g., "US-East-1"
  timeline: Array<{
    phase: string;
    completed: boolean;
    date?: string;
  }>;
}

/**
 * Website Management Types
 */
export interface DomainChangeRequest {
  newDomain: string;
  reason: string;
  notes?: string;
}

export interface SupportTicket {
  subject: string;
  message: string;
  category?: "billing" | "technical" | "general" | "domain" | "performance";
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

/**
 * Acuity Scheduling Types (Booking Page)
 */

export interface AcuityAppointmentType {
  id: number;
  name: string;
  duration: number; // minutes
  price?: number;
  description?: string;
  type?: string; // "service" | "class" | "series"
}

export interface AvailabilityDate {
  date: string; // YYYY-MM-DD format
  available: boolean;
}

export interface TimeSlot {
  datetime: string; // ISO 8601 format with timezone
}

export interface BookingRequest {
  datetime: string; // ISO 8601 format
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string; // IANA timezone identifier
  notes?: string;
}

export interface AcuityAppointment {
  id: number;
  datetime: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentTypeID: number;
  calendarID: number;
  timezone: string;
  notes?: string;
  confirmationEmail?: string;
  status?: string;
}

/**
 * Booking API Response Types
 */

export interface AvailabilityDatesResponse {
  dates: AvailabilityDate[];
}

export interface AvailabilityTimesResponse {
  times: TimeSlot[];
}

export interface BookingConfirmationResponse {
  appointmentId: number;
  datetime: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode?: number;
}
