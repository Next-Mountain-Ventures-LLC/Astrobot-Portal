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

type Step = "select" | "website" | "confirm" | "success";

export default function Booking() {
  const [step, setStep] = useState<Step>("select");
  const [designDateTime, setDesignDateTime] = useState<string | null>(null);
  const [launchDateTime, setLaunchDateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] =
    useState<BookingConfirmationResponse | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set()
  );
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(
    new Set()
  );
  const { logRequest, logResponse, logError } = useApiLog();

  const toggleFeature = (feature: string) => {
    const newSet = new Set(selectedFeatures);
    if (newSet.has(feature)) {
      newSet.delete(feature);
    } else {
      newSet.add(feature);
    }
    setSelectedFeatures(newSet);
  };

  const toggleIntegration = (integration: string) => {
    const newSet = new Set(selectedIntegrations);
    if (newSet.has(integration)) {
      newSet.delete(integration);
    } else {
      newSet.add(integration);
    }
    setSelectedIntegrations(newSet);
  };

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
      setStep("success");
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Failed to complete booking");
    },
  });

  const handleDatesSelect = (designDT: string, launchDT: string) => {
    setDesignDateTime(designDT);
    setLaunchDateTime(launchDT);
    setStep("website");
    setError(null);
  };

  const handleWebsiteSelect = () => {
    setStep("confirm");
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
    { key: "website", label: "About Your Website", number: 2 },
    { key: "confirm", label: "Confirm Details", number: 3 },
    { key: "success", label: "Complete", number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);
  const canGoBack =
    (step === "website" && designDateTime && launchDateTime) ||
    (step === "confirm" && designDateTime && launchDateTime) ||
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

            {/* Confirm Step */}
            <div
              className={`transition-all duration-500 transform ${
                step === "confirm"
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0 absolute"
              }`}
              style={{
                position: step === "confirm" ? "relative" : "absolute",
                pointerEvents: step === "confirm" ? "auto" : "none",
              }}
            >
              {step === "confirm" && designDateTime && launchDateTime && (
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
                        Confirm Your Details
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

            {/* Website Step - Combined Integrations & Features */}
            <div
              className={`transition-all duration-500 transform ${
                step === "website"
                  ? "translate-x-0 opacity-100"
                  : "translate-x-full opacity-0 absolute"
              }`}
              style={{
                position: step === "website" ? "relative" : "absolute",
                pointerEvents: step === "website" ? "auto" : "none",
              }}
            >
              {step === "website" && (
                <Card className="p-8 bg-background border-border">
                  <div className="space-y-8">
                    <div className="text-center space-y-3">
                      <h2 className="text-3xl font-bold text-foreground">
                        About Your Website
                      </h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Please show this out real quickly for your design. Select your current integrations and desired features.
                      </p>
                    </div>

                    {/* Integrations Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground text-center">
                        Current Integrations
                      </h4>
                      <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max px-1 justify-center">
                          {/* E-commerce */}
                          <button
                            onClick={() => toggleIntegration("ecommerce")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedIntegrations.has("ecommerce")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedIntegrations.has("ecommerce")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <svg className={`w-6 h-6 ${selectedIntegrations.has("ecommerce") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">E-commerce</span>
                            {selectedIntegrations.has("ecommerce") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>

                          {/* Scheduling */}
                          <button
                            onClick={() => toggleIntegration("scheduling")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedIntegrations.has("scheduling")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedIntegrations.has("scheduling")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <Calendar className={`w-6 h-6 ${selectedIntegrations.has("scheduling") ? "text-accent" : "text-primary"}`} />
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">Scheduling</span>
                            {selectedIntegrations.has("scheduling") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>

                          {/* Google Local */}
                          <button
                            onClick={() => toggleIntegration("googlelocal")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedIntegrations.has("googlelocal")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedIntegrations.has("googlelocal")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <svg className={`w-6 h-6 ${selectedIntegrations.has("googlelocal") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">Google Local</span>
                            {selectedIntegrations.has("googlelocal") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>

                          {/* Social Profiles */}
                          <button
                            onClick={() => toggleIntegration("social")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedIntegrations.has("social")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedIntegrations.has("social")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <svg className={`w-6 h-6 ${selectedIntegrations.has("social") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">Social</span>
                            {selectedIntegrations.has("social") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground text-center">
                        Website Features
                      </h4>
                      <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max px-1 justify-center">
                          {/* Menu */}
                          <button
                            onClick={() => toggleFeature("menu")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedFeatures.has("menu")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedFeatures.has("menu")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <svg className={`w-6 h-6 ${selectedFeatures.has("menu") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">Menu</span>
                            {selectedFeatures.has("menu") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>

                          {/* Blog */}
                          <button
                            onClick={() => toggleFeature("blog")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedFeatures.has("blog")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedFeatures.has("blog")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <svg className={`w-6 h-6 ${selectedFeatures.has("blog") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">Blog</span>
                            {selectedFeatures.has("blog") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>

                          {/* Contact Form */}
                          <button
                            onClick={() => toggleFeature("contact")}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all flex-shrink-0 relative ${
                              selectedFeatures.has("contact")
                                ? "border-accent bg-accent/10"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                              selectedFeatures.has("contact")
                                ? "bg-accent/20"
                                : "bg-primary/10"
                            }`}>
                              <svg className={`w-6 h-6 ${selectedFeatures.has("contact") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-foreground whitespace-nowrap">Contact</span>
                            {selectedFeatures.has("contact") && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Continue Button */}
                    <div className="pt-4 border-t border-border">
                      <Button
                        onClick={handleWebsiteSelect}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Continue to Confirm →
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

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
                  } else if (step === "features") {
                    setStep("integrations");
                  } else if (step === "form") {
                    setStep("features");
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
