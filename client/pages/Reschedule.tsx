import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { RescheduleForm } from "@/components/RescheduleForm";
import { RescheduleCalendar } from "@/components/RescheduleCalendar";
import { RescheduleDualPrompt } from "@/components/RescheduleDualPrompt";
import { AcuityAppointment, AppointmentsByEmailResponse } from "@shared/api";
import { addDays, parseISO } from "date-fns";

// State machine states
type RescheduleState =
  | "loading"
  | "view-current"
  | "select-new-date"
  | "check-launch"
  | "select-launch-date"
  | "confirming"
  | "success"
  | "error";

const DESIGN_APPOINTMENT_TYPE_ID = 87852183;
const LAUNCH_APPOINTMENT_TYPE_ID = 89122426;

export default function Reschedule() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  // State machine
  const [state, setState] = useState<RescheduleState>("loading");
  const [error, setError] = useState<string | null>(null);

  // Appointment data
  const [currentAppointment, setCurrentAppointment] = useState<AcuityAppointment | null>(null);
  const [launchAppointment, setLaunchAppointment] = useState<AcuityAppointment | null>(null);

  // New appointment data
  const [newDesignDateTime, setNewDesignDateTime] = useState<string | null>(null);
  const [newLaunchDateTime, setNewLaunchDateTime] = useState<string | null>(null);
  const [needsDualReschedule, setNeedsDualReschedule] = useState(false);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current appointment on load
  useEffect(() => {
    if (!appointmentId) {
      setError("No appointment ID provided. Please use a valid reschedule link.");
      setState("error");
      return;
    }

    const fetchAppointment = async () => {
      try {
        console.log("[Reschedule] Fetching appointment:", appointmentId);
        const response = await fetch(`/api/booking/appointments/${appointmentId}`);

        if (!response.ok) {
          let errorMessage = `Failed to fetch appointment (${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.warn("[Reschedule] Could not parse error response:", e);
          }
          throw new Error(errorMessage);
        }

        const appointment: AcuityAppointment = await response.json();
        console.log("[Reschedule] Fetched appointment:", appointment);

        if (!appointment.id) {
          throw new Error("Invalid appointment data returned from server");
        }

        setCurrentAppointment(appointment);

        // If this is a design appointment, check for launch appointment
        if (appointment.appointmentTypeID === DESIGN_APPOINTMENT_TYPE_ID) {
          try {
            const byEmailResponse = await fetch(
              `/api/booking/appointments/by-email/${encodeURIComponent(appointment.email)}`
            );

            if (byEmailResponse.ok) {
              const byEmailData: AppointmentsByEmailResponse = await byEmailResponse.json();
              console.log("[Reschedule] Fetched appointments by email:", byEmailData);

              // Find the launch appointment
              const launch = byEmailData.appointments.find(
                (appt) => appt.appointmentTypeID === LAUNCH_APPOINTMENT_TYPE_ID
              );

              if (launch) {
                setLaunchAppointment(launch);
                console.log("[Reschedule] Found associated launch appointment:", launch);
              }
            } else {
              console.warn("[Reschedule] Failed to fetch appointments by email:", byEmailResponse.status);
            }
          } catch (err) {
            console.warn("[Reschedule] Could not fetch other appointments:", err);
            // Continue anyway - we can still reschedule the design appointment
          }
        }

        setState("view-current");
      } catch (err: any) {
        console.error("[Reschedule] Error fetching appointment:", err);
        setError(err.message || "Failed to load appointment. Please check the appointment ID and try again.");
        setState("error");
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  // Handle design date selection
  const handleDesignDateSelected = (datetime: string) => {
    setNewDesignDateTime(datetime);
    console.log("[Reschedule] Design date selected:", datetime);

    // Check if we need dual reschedule
    if (launchAppointment) {
      const designDate = parseISO(datetime);
      const launchDate = parseISO(launchAppointment.datetime);
      const daysBetween = Math.ceil(
        (launchDate.getTime() - designDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log("[Reschedule] Days between design and launch:", daysBetween);

      if (daysBetween < 7) {
        setNeedsDualReschedule(true);
        setState("check-launch");
      } else {
        setState("confirming");
      }
    } else {
      setState("confirming");
    }
  };

  // Handle launch date selection
  const handleLaunchDateSelected = (datetime: string) => {
    setNewLaunchDateTime(datetime);
    console.log("[Reschedule] Launch date selected:", datetime);
    setState("confirming");
  };

  // Handle reschedule submission
  const handleConfirmReschedule = async () => {
    if (!currentAppointment || !newDesignDateTime) {
      setError("Missing required data for reschedule");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[Reschedule] Submitting reschedule request...");

      // Reschedule design appointment
      const designResponse = await fetch(`/api/booking/appointments/${currentAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: newDesignDateTime,
          appointmentTypeId: currentAppointment.appointmentTypeID,
        }),
      });

      if (!designResponse.ok) {
        const errorData = await designResponse.json();
        throw new Error(errorData.message || "Failed to reschedule design appointment");
      }

      console.log("[Reschedule] Design appointment rescheduled successfully");

      // If dual reschedule, also reschedule launch appointment
      if (needsDualReschedule && launchAppointment && newLaunchDateTime) {
        console.log("[Reschedule] Rescheduling launch appointment...");
        const launchResponse = await fetch(`/api/booking/appointments/${launchAppointment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datetime: newLaunchDateTime,
            appointmentTypeId: launchAppointment.appointmentTypeID,
          }),
        });

        if (!launchResponse.ok) {
          const errorData = await launchResponse.json();
          throw new Error(errorData.message || "Failed to reschedule launch appointment");
        }

        console.log("[Reschedule] Launch appointment rescheduled successfully");
      }

      setState("success");
    } catch (err: any) {
      console.error("[Reschedule] Error rescheduling appointment:", err);
      setError(err.message || "Failed to reschedule appointment");
      setState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different states
  if (state === "loading") {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <Card className="p-8 text-center max-w-sm">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-900 dark:text-white">
              Loading appointment details...
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (state === "error") {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
          <Card className="p-8 max-w-sm w-full">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Error</h1>
              <p className="text-slate-600 dark:text-slate-300">{error}</p>
              <Button onClick={() => window.history.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (state === "success") {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4">
          <Card className="p-8 max-w-sm w-full">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Success!</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Your appointment{needsDualReschedule ? "s have" : " has"} been successfully
                rescheduled. You should receive a confirmation email shortly.
              </p>
              <Button onClick={() => window.location.href = "/"} className="mt-4">
                Return Home
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Reschedule Appointment
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {state === "view-current" &&
                "Review your current appointment details below"}
              {state === "select-new-date" &&
                "Select a new date and time for your design meeting"}
              {state === "check-launch" &&
                "Your design meeting needs to be at least 7 days before your launch meeting"}
              {state === "select-launch-date" &&
                "Select a new date and time for your launch meeting"}
              {state === "confirming" &&
                "Review your changes before confirming"}
            </p>
          </div>

          {/* Error banner */}
          {error && state !== "error" && (
            <Card className="p-4 mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">{error}</p>
              </div>
            </Card>
          )}

          {/* Content based on state */}
          {state === "view-current" && currentAppointment && (
            <RescheduleForm
              appointment={currentAppointment}
              onReschedule={() => setState("select-new-date")}
              onCancel={() => window.history.back()}
            />
          )}

          {state === "select-new-date" && currentAppointment && (
            <RescheduleCalendar
              onDateTimeSelect={handleDesignDateSelected}
              onCancel={() => setState("view-current")}
              isLoading={isSubmitting}
              appointmentTypeId={currentAppointment.appointmentTypeID.toString()}
            />
          )}

          {state === "check-launch" && launchAppointment && newDesignDateTime && (
            <RescheduleDualPrompt
              launchAppointment={launchAppointment}
              newDesignDateTime={newDesignDateTime}
              onSelectLaunchDate={() => {
                // Calculate minimum date for launch (7 days after new design date)
                const designDate = parseISO(newDesignDateTime);
                const minLaunchDate = addDays(designDate, 7);
                setState("select-launch-date");
              }}
              onCancel={() => setState("select-new-date")}
              isLoading={isSubmitting}
            />
          )}

          {state === "select-launch-date" && launchAppointment && newDesignDateTime && (
            <RescheduleCalendar
              onDateTimeSelect={handleLaunchDateSelected}
              onCancel={() => setState("check-launch")}
              isLoading={isSubmitting}
              disableDatesBeforeThan={addDays(parseISO(newDesignDateTime), 7)}
              appointmentTypeId={launchAppointment.appointmentTypeID.toString()}
            />
          )}

          {state === "confirming" && currentAppointment && newDesignDateTime && (
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Confirm Reschedule
                </h2>

                {/* Design appointment change */}
                <div className="space-y-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Design Meeting
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Currently scheduled for:{" "}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {new Date(currentAppointment.datetime).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(currentAppointment.datetime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    New time:{" "}
                    <span className="font-medium">
                      {new Date(newDesignDateTime).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(newDesignDateTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </p>
                </div>

                {/* Launch appointment change (if dual reschedule) */}
                {needsDualReschedule && launchAppointment && newLaunchDateTime && (
                  <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Launch Meeting
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Currently scheduled for:{" "}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {new Date(launchAppointment.datetime).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(launchAppointment.datetime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      New time:{" "}
                      <span className="font-medium">
                        {new Date(newLaunchDateTime).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(newLaunchDateTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmReschedule}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Rescheduling..." : "Confirm Reschedule"}
                </Button>
                <Button
                  onClick={() => setState("view-current")}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
