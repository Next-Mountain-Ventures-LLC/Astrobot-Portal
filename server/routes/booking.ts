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
} from "@shared/api";

// Validation schemas
const getAvailabilityDatesSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format"),
});

const getAvailabilityTimesSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

const createAppointmentSchema = z.object({
  datetime: z.string().datetime("Invalid datetime format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10,}$/, "Phone must be at least 10 digits"),
  timezone: z.string().min(1, "Timezone is required"),
  notes: z.string().optional(),
});

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
    const { month } = getAvailabilityDatesSchema.parse(req.query);

    const appointmentTypeId = process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const timezone = process.env.ACUITY_TIMEZONE;
    const calendarId = process.env.ACUITY_CALENDAR_ID;

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

    const response: AvailabilityDatesResponse = {
      dates: (availableDates || []).map((date: string) => ({
        date,
        available: true,
      })),
    };

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
    const { date } = getAvailabilityTimesSchema.parse(req.query);

    const appointmentTypeId = process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const timezone = process.env.ACUITY_TIMEZONE;
    const calendarId = process.env.ACUITY_CALENDAR_ID;

    if (!appointmentTypeId || !timezone || !calendarId) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Acuity configuration incomplete",
      });
    }

    // Call Acuity API to get available times
    const availableTimes = await makeAcuityRequest("/availability/times", {
      params: {
        appointmentTypeID: appointmentTypeId,
        date,
        timezone,
        calendarID: calendarId,
      },
    });

    const response: AvailabilityTimesResponse = {
      times: (availableTimes || []).map((datetime: string) => ({
        datetime,
      })),
    };

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
    // Validate request body
    const bookingData = createAppointmentSchema.parse(req.body);

    const appointmentTypeId = process.env.ACUITY_APPOINTMENT_TYPE_ID;
    const calendarId = process.env.ACUITY_CALENDAR_ID;

    if (!appointmentTypeId || !calendarId) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Acuity configuration incomplete",
      });
    }

    // Prepare request body for Acuity API
    const acuityBody = {
      datetime: bookingData.datetime,
      appointmentTypeID: parseInt(appointmentTypeId),
      calendarID: parseInt(calendarId),
      firstName: bookingData.firstName,
      lastName: bookingData.lastName,
      email: bookingData.email,
      phone: bookingData.phone,
      timezone: bookingData.timezone,
      ...(bookingData.notes && { notes: bookingData.notes }),
    };

    // Call Acuity API to create appointment
    const appointment = await makeAcuityRequest("/appointments", {
      method: "POST",
      body: acuityBody,
    });

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
      appointmentTypeName: appointment.appointmentTypeName,
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
