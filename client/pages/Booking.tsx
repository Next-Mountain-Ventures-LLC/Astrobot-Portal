import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { BookingDateTimePicker } from "@/components/BookingDateTimePicker";
import { BookingForm, type BookingFormData } from "@/components/BookingForm";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { BookingDebugLog } from "@/components/BookingDebugLog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { BookingConfirmationResponse } from "@shared/api";

type Step = "select" | "form" | "confirm";

export default function Booking() {
  const [step, setStep] = useState<Step>("select");
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] =
    useState<BookingConfirmationResponse | null>(null);

  // Mutation for creating appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData & { datetime: string }) => {
      const res = await fetch("/api/booking/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          timezone: "America/Chicago",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create appointment");
      }

      return (await res.json()) as BookingConfirmationResponse;
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

  const handleDateTimeSelect = (datetime: string) => {
    setSelectedDateTime(datetime);
    setStep("form");
    setError(null);
  };

  const handleFormSubmit = async (formData: BookingFormData) => {
    if (!selectedDateTime) {
      setError("Please select a date and time before submitting");
      return;
    }

    createAppointmentMutation.mutate({
      ...formData,
      datetime: selectedDateTime,
    });
  };

  const handleNewBooking = () => {
    setStep("select");
    setSelectedDateTime(null);
    setAppointment(null);
    setError(null);
  };

  const handleClose = () => {
    window.location.href = "/";
  };

  // Step indicators
  const steps: { key: Step; label: string; number: number }[] = [
    { key: "select", label: "Select Date & Time", number: 1 },
    { key: "form", label: "Your Info", number: 2 },
    { key: "confirm", label: "Confirm", number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const canGoBack = (step === "form" && selectedDateTime) || false;

  return (
    <Layout>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              Schedule Your Consultation
            </h1>
            <p className="text-lg text-muted-foreground">
              Book a time that works best for you
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                    step === s.key
                      ? "bg-accent text-accent-foreground"
                      : idx < currentStepIndex
                        ? "bg-green-500 text-white"
                        : "bg-border text-muted-foreground"
                  }`}
                >
                  {idx < currentStepIndex ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    s.number
                  )}
                </div>
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
                      idx < currentStepIndex ? "bg-green-500" : "bg-border"
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
          <div className="space-y-6">
            {/* Date & Time Selection Step */}
            {step === "select" && (
              <BookingDateTimePicker
                onDateTimeSelect={handleDateTimeSelect}
                onError={setError}
              />
            )}

            {/* Form Step */}
            {step === "form" && selectedDateTime && (
              <div className="space-y-4">
                <Card className="p-6 bg-background border-border">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Selected Date & Time
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(selectedDateTime).toLocaleString()}
                    </p>
                  </div>
                </Card>
                <BookingForm
                  onSubmit={handleFormSubmit}
                  isLoading={createAppointmentMutation.isPending}
                  selectedDateTime={selectedDateTime}
                />
              </div>
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
                  if (step === "form") {
                    setSelectedDateTime(null);
                    setStep("select");
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

              {step === "select" && selectedDateTime && (
                <Button
                  onClick={() => setStep("form")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Next →
                </Button>
              )}

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
