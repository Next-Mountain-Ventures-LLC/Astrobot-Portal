import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { BookingDualDateTimePicker } from "@/components/BookingDualDateTimePicker";
import { BookingForm, type BookingFormData } from "@/components/BookingForm";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { BookingDebugLog } from "@/components/BookingDebugLog";
import { useApiLog } from "@/hooks/use-api-log";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Calendar, User } from "lucide-react";
import { BookingConfirmationResponse } from "@shared/api";

type Step = "select" | "form" | "integrations" | "confirm";

export default function Booking() {
  const [step, setStep] = useState<Step>("select");
  const [designDateTime, setDesignDateTime] = useState<string | null>(null);
  const [launchDateTime, setLaunchDateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] =
    useState<BookingConfirmationResponse | null>(null);
  const { logRequest, logResponse, logError } = useApiLog();

  // Mutation for creating appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData & { datetime: string }) => {
      const startTime = performance.now();
      const logId = logRequest("POST", "/api/booking/appointments", {
        ...data,
        timezone: "America/Chicago",
      });

      try {
        const res = await fetch("/api/booking/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            timezone: "America/Chicago",
          }),
        });

        const duration = Math.round(performance.now() - startTime);

        if (!res.ok) {
          const errorData = await res.json();
          const errorMessage = errorData.message || "Failed to create appointment";
          logError(logId, errorMessage, duration);
          throw new Error(errorMessage);
        }

        const responseData = (await res.json()) as BookingConfirmationResponse;
        logResponse(logId, res.status, res.statusText, responseData, duration);
        return responseData;
      } catch (err: any) {
        const duration = Math.round(performance.now() - startTime);
        if (!error) {
          logError(logId, err.message || "Failed to create appointment", duration);
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      setAppointment(data);
      setStep("confirm");
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to complete booking");
    },
  });

  const handleDatesSelect = (designDT: string, launchDT: string) => {
    setDesignDateTime(designDT);
    setLaunchDateTime(launchDT);
    setStep("integrations");
    setError(null);
  };

  const handleFormSubmit = async (formData: BookingFormData) => {
    if (!designDateTime || !launchDateTime) {
      setError("Please select both design and launch dates/times before submitting");
      return;
    }

    // Book the design meeting
    createAppointmentMutation.mutate({
      ...formData,
      datetime: designDateTime,
    });
  };

  const handleNewBooking = () => {
    setStep("select");
    setDesignDateTime(null);
    setLaunchDateTime(null);
    setAppointment(null);
    setError(null);
  };

  const handleClose = () => {
    window.location.href = "/";
  };

  // Step indicators
  const steps: { key: Step; label: string; number: number }[] = [
    { key: "select", label: "Select Date & Time", number: 1 },
    { key: "integrations", label: "About your website", number: 2 },
    { key: "form", label: "Your Info", number: 3 },
    { key: "confirm", label: "Confirm", number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const canGoBack =
    (step === "form" && designDateTime && launchDateTime) ||
    (step === "integrations") ||
    false;

  return (
    <Layout>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              🚀 Schedule your launch week
            </h1>
            <p className="text-lg text-muted-foreground">
              Select a time to meet with your designer and a time to have your launch meeting before live
            </p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              You'll get a text after your first mock-up is made and can work with your designer through the week to make changes.
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (idx < currentStepIndex) {
                      setStep(s.key);
                    }
                  }}
                  disabled={idx > currentStepIndex}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                    step === s.key
                      ? "bg-accent text-accent-foreground cursor-default"
                      : idx < currentStepIndex
                        ? "bg-primary text-white cursor-pointer hover:bg-primary/90"
                        : "bg-border text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {idx < currentStepIndex ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    s.number
                  )}
                </button>
                <span
                  className={`text-sm font-medium ${
                    step === s.key
                      ? "text-accent"
                      : idx < currentStepIndex
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      idx < currentStepIndex ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Content Area */}
          <div className="relative space-y-6 overflow-hidden">
            {/* Date & Time Selection Step */}
            <div
              className={`transition-all duration-500 transform ${
                step === "select"
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-full opacity-0 absolute"
              }`}
              style={{
                position: step === "select" ? "relative" : "absolute",
                pointerEvents: step === "select" ? "auto" : "none",
                width: "100%",
              }}
            >
              {step === "select" && (
                <BookingDualDateTimePicker
                  onDatesSelect={handleDatesSelect}
                  onError={setError}
                />
              )}
            </div>

            {/* Form Step */}
            <div
              className={`transition-all duration-500 transform ${
                step === "form"
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0 absolute"
              }`}
              style={{
                position: step === "form" ? "relative" : "absolute",
                pointerEvents: step === "form" ? "auto" : "none",
              }}
            >
              {step === "form" && designDateTime && launchDateTime && (
                <Card className="p-6 bg-background border-border">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Scheduled Dates Section */}
                    <div className="lg:col-span-1 space-y-6">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Your schedule
                      </h3>

                      {/* Avatar Section */}
                      <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                          <User className="w-10 h-10 text-primary" />
                        </div>
                      </div>

                      {/* Date Cards Container with more spacing */}
                      <div className="space-y-8">
                        {/* Design Meeting Calendar Card */}
                        <button
                          onClick={() => setStep("select")}
                          className="w-2/3 mx-auto flex flex-col items-center gap-3 p-2 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <div className="relative w-28 h-36 bg-primary/10 group-hover:bg-primary/20 border-2 border-primary rounded-lg p-3 flex flex-col justify-between transition-all">
                            <div className="text-sm font-bold text-primary uppercase whitespace-normal">
                              Design
                            </div>
                            <div className="text-4xl font-bold text-foreground">
                              {new Date(designDateTime).getDate()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(designDateTime).toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-muted-foreground text-center">
                            {new Date(designDateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>

                        {/* Launch Date Calendar Card */}
                        <button
                          onClick={() => setStep("select")}
                          className="w-2/3 mx-auto flex flex-col items-center gap-3 p-2 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                          <div className="relative w-28 h-36 bg-primary/10 group-hover:bg-primary/20 border-2 border-primary rounded-lg p-3 flex flex-col justify-between transition-all">
                            <div className="text-sm font-bold text-primary uppercase whitespace-normal">
                              Launch
                            </div>
                            <div className="text-4xl font-bold text-foreground">
                              {new Date(launchDateTime).getDate()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(launchDateTime).toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-muted-foreground text-center">
                            {new Date(launchDateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Right: Form Section */}
                    <div className="lg:col-span-2">
                      <h4 className="text-lg font-semibold text-foreground mb-6">
                        Your Information
                      </h4>
                      <BookingForm
                        onSubmit={handleFormSubmit}
                        isLoading={createAppointmentMutation.isPending}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Integrations Step */}
            {step === "integrations" && (
              <Card className="p-8 bg-background border-border">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">
                    Integrations
                  </h3>
                  <p className="text-muted-foreground">
                    Tell us about your website integrations and requirements.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Coming soon - we're building this section for you!
                  </p>
                  <Button
                    onClick={() => setStep("confirm")}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4"
                  >
                    Continue to Confirm →
                  </Button>
                </div>
              </Card>
            )}

            {/* Confirmation Step */}
            {step === "confirm" && appointment && (
              <BookingConfirmation
                appointment={appointment}
                onNewBooking={handleNewBooking}
                onClose={handleClose}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          {step !== "confirm" && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                onClick={() => {
                  if (step === "integrations") {
                    setStep("select");
                  } else if (step === "form") {
                    setStep("integrations");
                  }
                }}
                variant="outline"
                disabled={!canGoBack}
                className={
                  !canGoBack
                    ? "opacity-50 cursor-not-allowed"
                    : "border-border text-foreground hover:bg-background"
                }
              >
                ← Back
              </Button>

              <p className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </p>

              {step === "form" && (
                <div className="text-sm text-muted-foreground">
                  Complete the form above
                </div>
              )}
            </div>
          )}

          {/* Debug Log */}
          <BookingDebugLog />
        </div>
      </div>
    </Layout>
  );
}
