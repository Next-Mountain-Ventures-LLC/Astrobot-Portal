/**
 * Booking Routes - Acuity Scheduling API Proxy
 * All routes proxy requests to Acuity API with secure server-side authentication
 */

import { RequestHandler } from "express";
import { z } from "zod";
import { makeAcuityRequest } from "../lib/acuity-client";
import {
  AvailabilityDatesResponse,
  AvailabilityTimesResponse,
  BookingConfirmationResponse,
  AcuityAppointmentType,
  RescheduleAppointmentRequest,
  RescheduleAppointmentResponse,
  AppointmentsByEmailResponse,
} from "@shared/api";
import Stripe from "stripe";

// Validation schemas
const getAvailabilityDatesSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format"),
  appointmentTypeId: z.string().optional(),
});

const getAvailabilityTimesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  appointmentTypeId: z.string().optional(),
});

const rescheduleAppointmentSchema = z.object({
  datetime: z.string().min(1, "Datetime is required").regex(/^\d{4}-\d{2}-\d{2}T/, "Invalid datetime format - must be ISO 8601"),
  appointmentTypeId: z.string().optional(),
});

/**
 * IMPORTANT: All form data from the booking flow is passed through in the notes field.
 *
 * The client compiles all form responses (questions, integrations, interests, domain, notes)
 * into a formatted notes string. This schema validates the appointment data, but the actual
 * form field details are passed as a compiled string in the notes field.
 *
 * WHEN MODIFYING THE BOOKING FORM:
 * 1. Update the client-side label mappings (getQuestionLabel, getIntegrationLabel, getInterestLabel)
 * 2. Add the new data to the designNotesContent array in the appointment mutation
 * 3. The notes field will automatically include all collected data
 * 4. No changes to this schema are needed unless modifying the appointment structure itself
 */
const createAppointmentSchema = z.object({
  datetime: z.string().min(1, "Datetime is required").regex(/^\d{4}-\d{2}-\d{2}T/, "Invalid datetime format - must be ISO 8601"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10,}$/, "Phone must be at least 10 digits"),
  timezone: z.string().min(1, "Timezone is required"),
  notes: z.string().optional(), // Contains compiled form responses in format: "Section ~ value1, value2..."
  appointmentTypeId: z.string().optional(),
});

/**
 * POST /api/booking/check-availability
 * Check if appointment type has availability for a given datetime
 * Uses Acuity's check-times endpoint to validate availability
 */
export const handleCheckAvailability: RequestHandler = async (req, res) => {
  try {
    const appointmentTypeId = process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const calendarId = process.env.ACUITY_CALENDAR_ID;
    const timezone = process.env.ACUITY_TIMEZONE;

    if (!appointmentTypeId || !calendarId || !timezone) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Acuity configuration incomplete",
      });
    }

    // Get current date + 7 days as a test datetime
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7);
    const testDateTime = testDate.toISOString();

    console.log("[Booking] Checking availability for appointment type:", {
      appointmentTypeId,
      calendarId,
      timezone,
      testDateTime,
    });

    // Call Acuity API to check availability
    const checkResult = await makeAcuityRequest("/availability/check-times", {
      method: "POST",
      body: {
        datetime: testDateTime,
        appointmentTypeID: parseInt(appointmentTypeId),
        calendarID: parseInt(calendarId),
      },
    });

    console.log("[Booking] Availability check result:", checkResult);

    res.json({
      available: checkResult.available,
      appointmentTypeId,
      calendarId,
      timezone,
      testDateTime,
      response: checkResult,
    });
  } catch (error: any) {
    console.error("[Booking] Availability check error:", {
      message: error.message,
      statusCode: error.statusCode,
    });

    res.status(error.statusCode || 500).json({
      error: "Availability check failed",
      message: error.message || "Could not check availability",
      details: error.error,
    });
  }
};

/**
 * GET /api/booking/appointment-type-details
 * Fetch appointment type information (name, duration, price)
 */
export const handleGetAppointmentTypeDetails: RequestHandler = async (
  req,
  res
) => {
  try {
    const appointmentTypeId = process.env.ACUITY_APPOINTMENT_TYPE_ID;

    if (!appointmentTypeId) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Appointment type not configured",
      });
    }

    const appointmentTypes = await makeAcuityRequest("/appointment-types");

    // Filter for the configured appointment type
    const appointmentType = (appointmentTypes as AcuityAppointmentType[]).find(
      (type) => type.id === parseInt(appointmentTypeId)
    );

    if (!appointmentType) {
      return res.status(404).json({
        error: "Appointment type not found",
        message: `Appointment type ${appointmentTypeId} not found in Acuity`,
      });
    }

    res.json({
      id: appointmentType.id,
      name: appointmentType.name,
      duration: appointmentType.duration,
      price: appointmentType.price,
      description: appointmentType.description,
    });
  } catch (error: any) {
    console.error("[Booking] Error fetching appointment type:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to fetch appointment type",
      message: error.message || "An error occurred",
    });
  }
};

/**
 * GET /api/booking/availability/dates
 * Fetch available dates for a given month
 */
export const handleGetAvailabilityDates: RequestHandler = async (req, res) => {
  try {
    // Validate query params
    const { month, appointmentTypeId: queryAppointmentTypeId } = getAvailabilityDatesSchema.parse(req.query);

    const appointmentTypeId = queryAppointmentTypeId || process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const timezone = process.env.ACUITY_TIMEZONE;
    const calendarId = process.env.ACUITY_CALENDAR_ID;
    const userId = process.env.ACUITY_USER_ID;
    const apiKey = process.env.ACUITY_API_KEY;

    if (!appointmentTypeId || !timezone || !calendarId) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Acuity configuration incomplete",
      });
    }

    // Call Acuity API to get available dates
    const availableDates = await makeAcuityRequest("/availability/dates", {
      params: {
        appointmentTypeID: appointmentTypeId,
        month,
        timezone,
        calendarID: calendarId,
      },
    });

    console.log("[Booking] Acuity API response:", {
      isArray: Array.isArray(availableDates),
      length: Array.isArray(availableDates) ? availableDates.length : 0,
      sample: Array.isArray(availableDates) ? availableDates.slice(0, 2) : availableDates,
    });

    // Handle both array and object responses from Acuity
    let dates: string[] = [];
    if (Array.isArray(availableDates)) {
      // Acuity returns array of objects like [{ date: "2026-01-14" }, ...]
      dates = availableDates.map((item: any) =>
        typeof item === "string" ? item : item.date
      );
    } else if (typeof availableDates === "object" && availableDates.dates && Array.isArray(availableDates.dates)) {
      dates = availableDates.dates.map((item: any) =>
        typeof item === "string" ? item : item.date
      );
    } else if (availableDates) {
      console.warn("[Booking] Unexpected response format from Acuity:", availableDates);
      dates = [];
    }

    console.log("[Booking] Extracted dates:", {
      count: dates.length,
      sample: dates.slice(0, 3),
    });

    const response: AvailabilityDatesResponse = {
      dates: dates.map((dateString: string) => ({
        date: dateString,
        available: true,
      })),
    };

    console.log("[Booking] Returning response with", dates.length, "available dates");
    res.json(response);
  } catch (error: any) {
    console.error("[Booking] Error fetching availability dates:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({
        error: "Invalid request",
        message: error.message || "Invalid month format",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to fetch available dates",
      message: error.message || "An error occurred",
    });
  }
};

/**
 * GET /api/booking/availability/times
 * Fetch available time slots for a specific date
 */
export const handleGetAvailabilityTimes: RequestHandler = async (req, res) => {
  try {
    // Validate query params
    const { date, appointmentTypeId: queryAppointmentTypeId } = getAvailabilityTimesSchema.parse(req.query);

    const appointmentTypeId = queryAppointmentTypeId || process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const timezone = process.env.ACUITY_TIMEZONE;
    const calendarId = process.env.ACUITY_CALENDAR_ID;

    if (!appointmentTypeId || !timezone || !calendarId) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Acuity configuration incomplete",
      });
    }

    console.log("[Booking] Fetching availability times:", {
      appointmentTypeId,
      date,
      timezone,
      calendarId,
    });

    // Call Acuity API to get available times
    const availableTimes = await makeAcuityRequest("/availability/times", {
      params: {
        appointmentTypeID: appointmentTypeId,
        date,
        timezone,
        calendarID: calendarId,
      },
    });

    console.log("[Booking] Acuity API response:", {
      isArray: Array.isArray(availableTimes),
      length: Array.isArray(availableTimes) ? availableTimes.length : 0,
      sample: Array.isArray(availableTimes) ? availableTimes.slice(0, 2) : availableTimes,
    });

    // Handle both array and object responses from Acuity
    // Acuity returns: { time: "2026-01-14T08:00:00-0600", slotsAvailable: 1 }
    let times: string[] = [];
    if (Array.isArray(availableTimes)) {
      times = availableTimes.map((item: any) => {
        // Item can be a string or object with "time" property
        if (typeof item === "string") {
          return item;
        } else if (item.time) {
          return item.time;
        } else if (item.datetime) {
          return item.datetime;
        }
        return null;
      }).filter((t): t is string => t !== null);
    } else if (typeof availableTimes === "object" && availableTimes.times && Array.isArray(availableTimes.times)) {
      times = availableTimes.times.map((item: any) => {
        if (typeof item === "string") {
          return item;
        } else if (item.time) {
          return item.time;
        } else if (item.datetime) {
          return item.datetime;
        }
        return null;
      }).filter((t): t is string => t !== null);
    } else if (availableTimes) {
      console.warn("[Booking] Unexpected response format from Acuity:", availableTimes);
      times = [];
    }

    console.log("[Booking] Extracted times:", {
      count: times.length,
      sample: times.slice(0, 3),
      rawSample: Array.isArray(availableTimes) ? availableTimes.slice(0, 2) : "not array",
    });

    const response: AvailabilityTimesResponse = {
      times: times.map((datetimeString: string) => ({
        datetime: datetimeString,
      })),
    };

    console.log("[Booking] Returning response with", times.length, "available times");
    res.json(response);
  } catch (error: any) {
    console.error("[Booking] Error fetching availability times:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({
        error: "Invalid request",
        message: error.message || "Invalid date format or no availability",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to fetch available times",
      message: error.message || "An error occurred",
    });
  }
};

/**
 * POST /api/booking/appointments
 * Create a new appointment (booking)
 */
export const handleCreateAppointment: RequestHandler = async (req, res) => {
  try {
    // Log incoming request data
    console.log("[Booking] Incoming appointment request:", {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      datetime: req.body.datetime,
      hasNotes: !!req.body.notes,
      notesLength: req.body.notes?.length || 0,
      notesPreview: req.body.notes?.substring(0, 100),
    });

    // Validate request body
    const bookingData = createAppointmentSchema.parse(req.body);

    // Use provided appointmentTypeId or fall back to environment variable
    const appointmentTypeId = bookingData.appointmentTypeId || process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const calendarId = process.env.ACUITY_CALENDAR_ID;

    if (!appointmentTypeId || !calendarId) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Acuity configuration incomplete",
      });
    }

    // Prepare request body for Acuity API
    // Based on Acuity documentation: https://acuityscheduling.com/api.html
    // Required fields: datetime, appointmentTypeID, firstName, lastName
    // Optional: email, phone, notes
    const acuityBody: any = {
      datetime: bookingData.datetime,
      appointmentTypeID: parseInt(appointmentTypeId),
      firstName: bookingData.firstName,
      lastName: bookingData.lastName,
    };

    // Add optional fields
    if (bookingData.email) acuityBody.email = bookingData.email;
    if (bookingData.phone) acuityBody.phone = bookingData.phone;
    if (bookingData.notes) acuityBody.notes = bookingData.notes;

    console.log("[Booking] Prepared Acuity request body:", {
      firstName: acuityBody.firstName,
      lastName: acuityBody.lastName,
      email: acuityBody.email,
      phone: acuityBody.phone,
      datetime: acuityBody.datetime,
      hasNotes: !!acuityBody.notes,
      notesLength: acuityBody.notes?.length || 0,
      fullNotes: acuityBody.notes || "NO NOTES",
      appointmentTypeID: acuityBody.appointmentTypeID,
      calendarID: acuityBody.calendarID,
      timezone: acuityBody.timezone,
    });

    // Log the complete payload JSON
    console.log("[Booking] COMPLETE PAYLOAD BEING SENT TO ACUITY:");
    console.log(JSON.stringify(acuityBody, null, 2));

    // Call Acuity API to create appointment
    // NOTE: admin=true parameter is required to properly create appointments with notes
    const appointment = await makeAcuityRequest("/appointments", {
      method: "POST",
      params: { admin: true },
      body: acuityBody,
    });

    console.log("[Booking] Acuity appointment created:", {
      appointmentId: appointment.id,
      hasNotesField: !!appointment.notes,
      hasClientNotesField: !!appointment.clientNotes,
      notesFromAcuity: appointment.notes ? appointment.notes.substring(0, 100) : "NO NOTES FIELD",
      clientNotesFromAcuity: appointment.clientNotes ? appointment.clientNotes.substring(0, 100) : "NO CLIENTNOTES FIELD",
    });

    console.log("[Booking] COMPLETE ACUITY RESPONSE:", JSON.stringify(appointment, null, 2));

    const response: BookingConfirmationResponse = {
      appointmentId: appointment.id,
      datetime: appointment.datetime,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      email: appointment.email,
      phone: appointment.phone,
      message:
        "Your appointment has been scheduled successfully. A confirmation email will be sent to you shortly.",
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("[Booking] Error creating appointment:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    if (error.statusCode === 400 || error instanceof z.ZodError) {
      const message =
        error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid request data"
          : error.message || "Invalid appointment request";

      return res.status(400).json({
        error: "Invalid booking request",
        message,
      });
    }

    if (error.statusCode === 422) {
      return res.status(422).json({
        error: "Time slot unavailable",
        message:
          error.message ||
          "The selected time slot is no longer available. Please select another time.",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to create appointment",
      message: error.message || "An error occurred while booking",
    });
  }
};

/**
 * GET /api/booking/appointments/:id
 * Fetch appointment details for confirmation
 */
export const handleGetAppointmentDetails: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Appointment ID must be a number",
      });
    }

    // Call Acuity API to get appointment details
    const appointment = await makeAcuityRequest(`/appointments/${id}`);

    res.json({
      id: appointment.id,
      datetime: appointment.datetime,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      email: appointment.email,
      phone: appointment.phone,
      timezone: appointment.timezone,
      appointmentTypeID: appointment.appointmentTypeID,
      type: appointment.type,
      calendarID: appointment.calendarID,
      status: appointment.status,
    });
  } catch (error: any) {
    console.error("[Booking] Error fetching appointment details:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        error: "Appointment not found",
        message: "The requested appointment could not be found",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to fetch appointment",
      message: error.message || "An error occurred",
    });
  }
};

/**
 * GET /api/booking/stripe-session/:sessionId
 * Retrieve Stripe checkout session details and customer information
 * This endpoint uses the Stripe secret key to safely retrieve session data
 */
export const handleGetStripeSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error("[Booking] Stripe secret key not configured");
      return res.status(500).json({
        error: "Server configuration error",
        message: "Stripe is not properly configured",
      });
    }

    if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Invalid Stripe session ID format",
      });
    }

    console.log("[Booking] Retrieving Stripe session:", sessionId);

    const stripe = new Stripe(stripeSecretKey);

    // Retrieve the checkout session with customer details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer"],
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        message: "The Stripe checkout session could not be found",
      });
    }

    // Extract customer details from the session
    const customerDetails = session.customer_details;
    const customer = session.customer;

    // Build response with customer information
    const responseData = {
      sessionId: session.id,
      status: session.payment_status,
      firstName: customerDetails?.name ? customerDetails.name.split(" ")[0] : "",
      lastName: customerDetails?.name ? customerDetails.name.split(" ").slice(1).join(" ") : "",
      email: customerDetails?.email || session.customer_email || "",
      phone: customerDetails?.phone || "",
      // Additional metadata if stored in the session
      metadata: session.metadata || {},
    };

    console.log("[Booking] Successfully retrieved Stripe session:", {
      sessionId: session.id,
      status: session.payment_status,
    });

    res.json(responseData);
  } catch (error: any) {
    console.error("[Booking] Error retrieving Stripe session:", {
      message: error.message,
      statusCode: error.statusCode,
    });

    if (error.type === "StripeInvalidRequestError") {
      return res.status(404).json({
        error: "Stripe session not found",
        message: "The requested Stripe session ID is invalid or expired",
      });
    }

    if (error.type === "StripeAuthenticationError") {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Stripe API",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to retrieve Stripe session",
      message: error.message || "An error occurred while retrieving session details",
    });
  }
};

/**
 * GET /api/booking/appointments/by-email/:email
 * Fetch all appointments for a customer by email
 * Used to find the launch appointment when rescheduling a design appointment
 */
export const handleGetAppointmentsByEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        message: "Email parameter is required",
      });
    }

    console.log("[Booking] Fetching appointments for email:", { email });

    // Call Acuity API to get all appointments for this email
    const appointments = await makeAcuityRequest("/appointments", {
      params: { email },
    });

    // Ensure we have an array of appointments
    const appointmentList = Array.isArray(appointments) ? appointments : [];

    console.log("[Booking] Found appointments:", {
      email,
      count: appointmentList.length,
      appointmentIds: appointmentList.map((a: any) => a.id),
    });

    const response: AppointmentsByEmailResponse = {
      appointments: appointmentList.map((appt: any) => ({
        id: appt.id,
        datetime: appt.datetime,
        firstName: appt.firstName,
        lastName: appt.lastName,
        email: appt.email,
        phone: appt.phone,
        appointmentTypeID: appt.appointmentTypeID,
        type: appt.type,
        calendarID: appt.calendarID,
        timezone: appt.timezone,
        notes: appt.notes,
        status: appt.status,
      })),
    };

    res.json(response);
  } catch (error: any) {
    console.error("[Booking] Error fetching appointments by email:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        error: "No appointments found",
        message: "No appointments found for the provided email",
        appointments: [],
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to fetch appointments",
      message: error.message || "An error occurred",
    });
  }
};

/**
 * PUT /api/booking/appointments/:id
 * Reschedule an existing appointment
 * Calls Acuity PATCH endpoint to update the appointment datetime
 */
export const handleRescheduleAppointment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Appointment ID must be a number",
      });
    }

    // Validate request body
    const rescheduleData = rescheduleAppointmentSchema.parse(req.body);

    console.log("[Booking] Incoming reschedule request:", {
      appointmentId: id,
      datetime: rescheduleData.datetime,
      appointmentTypeId: rescheduleData.appointmentTypeId,
    });

    // Prepare request body for Acuity API
    // PATCH /appointments/:id endpoint
    const acuityBody: any = {
      datetime: rescheduleData.datetime,
    };

    console.log("[Booking] Prepared Acuity reschedule request body:", {
      appointmentId: id,
      datetime: acuityBody.datetime,
    });

    // Call Acuity API to reschedule appointment
    // According to Acuity docs: PUT /appointments/{id}/reschedule
    // NOTE: admin=true parameter is required for rescheduling
    const updatedAppointment = await makeAcuityRequest(
      `/appointments/${id}/reschedule`,
      {
        method: "PUT",
        params: { admin: true },
        body: acuityBody,
      }
    );

    console.log("[Booking] Acuity appointment rescheduled:", {
      appointmentId: updatedAppointment.id,
      newDatetime: updatedAppointment.datetime,
    });

    const response: RescheduleAppointmentResponse = {
      id: updatedAppointment.id,
      datetime: updatedAppointment.datetime,
      appointmentTypeID: updatedAppointment.appointmentTypeID,
      type: updatedAppointment.type,
      firstName: updatedAppointment.firstName,
      lastName: updatedAppointment.lastName,
      email: updatedAppointment.email,
      phone: updatedAppointment.phone,
      timezone: updatedAppointment.timezone,
      status: updatedAppointment.status,
    };

    res.json(response);
  } catch (error: any) {
    console.error("[Booking] Error rescheduling appointment:", error);

    if (error.statusCode === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Unable to authenticate with Acuity API",
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        error: "Appointment not found",
        message: "The requested appointment could not be found",
      });
    }

    if (error.statusCode === 400 || error instanceof z.ZodError) {
      const message =
        error instanceof z.ZodError
          ? error.errors[0]?.message || "Invalid request data"
          : error.message || "Invalid reschedule request";

      return res.status(400).json({
        error: "Invalid reschedule request",
        message,
      });
    }

    if (error.statusCode === 422) {
      return res.status(422).json({
        error: "Time slot unavailable",
        message:
          error.message ||
          "The selected time slot is no longer available. Please select another time.",
      });
    }

    res.status(error.statusCode || 500).json({
      error: "Failed to reschedule appointment",
      message: error.message || "An error occurred while rescheduling",
    });
  }
};
