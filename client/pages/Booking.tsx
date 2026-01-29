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

type WebsitePage = "page1" | "page2" | "page3";

export default function Booking() {
  const [step, setStep] = useState<Step>("select");
  const [websitePage, setWebsitePage] = useState<WebsitePage>("page1");
  const [designDateTime, setDesignDateTime] = useState<string | null>(null);
  const [launchDateTime, setLaunchDateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] =
    useState<BookingConfirmationResponse | null>(null);

  // Page 1: Initial Questions
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  // Page 2: Current Integrations
  const [selectedCurrentIntegrations, setSelectedCurrentIntegrations] = useState<Set<string>>(
    new Set()
  );
  // Page 3: Add-ons
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(
    new Set()
  );

  const { logRequest, logResponse, logError } = useApiLog();

  const toggleQuestion = (question: string) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(question)) {
      newSet.delete(question);
    } else {
      newSet.add(question);
    }
    setSelectedQuestions(newSet);
  };

  const toggleCurrentIntegration = (integration: string) => {
    const newSet = new Set(selectedCurrentIntegrations);
    if (newSet.has(integration)) {
      newSet.delete(integration);
    } else {
      newSet.add(integration);
    }
    setSelectedCurrentIntegrations(newSet);
  };

  const toggleAddon = (addon: string) => {
    const newSet = new Set(selectedAddons);
    if (newSet.has(addon)) {
      newSet.delete(addon);
    } else {
      newSet.add(addon);
    }
    setSelectedAddons(newSet);
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
    setWebsitePage("page1");
    setError(null);
  };

  const handleWebsitePageContinue = () => {
    if (websitePage === "page1") {
      setWebsitePage("page2");
    } else if (websitePage === "page2") {
      setWebsitePage("page3");
    } else if (websitePage === "page3") {
      setStep("confirm");
    }
    setError(null);
  };

  const handleWebsitePageBack = () => {
    if (websitePage === "page2") {
      setWebsitePage("page1");
    } else if (websitePage === "page3") {
      setWebsitePage("page2");
    }
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

            {/* Website Step - Multi-page Form */}
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
                    {/* Page 1: Initial Questions */}
                    {websitePage === "page1" && (
                      <div className="space-y-8">
                        <div className="text-center space-y-3">
                          <h2 className="text-3xl font-bold text-foreground">
                            A few questions from your designer.
                          </h2>
                          <p className="text-muted-foreground max-w-2xl mx-auto">
                            Your designer has a few questions about what you are building together. Are you excited? We are!
                          </p>
                          <p className="text-muted-foreground max-w-2xl mx-auto">
                            Tell us about the website we're about to build together <span className="text-sm">(select all that apply)</span>
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            {/* Brand New Website */}
                            <button
                              onClick={() => toggleQuestion("brand-new")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("brand-new")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">Brand New Website!</span>
                              {selectedQuestions.has("brand-new") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* Website Redesign */}
                            <button
                              onClick={() => toggleQuestion("redesign")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("redesign")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">Website Redesign.</span>
                              {selectedQuestions.has("redesign") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* I own the domain */}
                            <button
                              onClick={() => toggleQuestion("own-domain")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("own-domain")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I own the domain.</span>
                              {selectedQuestions.has("own-domain") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* I know the domain I want */}
                            <button
                              onClick={() => toggleQuestion("know-domain")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("know-domain")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I know the domain I want.</span>
                              {selectedQuestions.has("know-domain") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* SEO Services */}
                            <button
                              onClick={() => toggleQuestion("seo")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("seo")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I need Search Engine Optimization Services</span>
                              {selectedQuestions.has("seo") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* Traffic source */}
                            <button
                              onClick={() => toggleQuestion("traffic")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("traffic")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I already know where my traffic will be coming from.</span>
                              {selectedQuestions.has("traffic") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>

                            {/* No idea but have an idea */}
                            <button
                              onClick={() => toggleQuestion("no-idea")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("no-idea")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I don't know anything but I have an idea!</span>
                              {selectedQuestions.has("no-idea") && (
                                <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Page 2: Current Integrations */}
                    {websitePage === "page2" && (
                      <div className="space-y-8">
                        <div className="text-center space-y-3">
                          <h2 className="text-3xl font-bold text-foreground">
                            About your brand
                          </h2>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Tell us about any of the integrations you're currently using
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="pb-4">
                            <div className="grid grid-cols-5 gap-4 max-w-4xl mx-auto">
                              {/* E-commerce */}
                              <button
                                onClick={() => toggleCurrentIntegration("ecommerce")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("ecommerce")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("ecommerce")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("ecommerce") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">E-commerce</span>
                                {selectedCurrentIntegrations.has("ecommerce") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Scheduling */}
                              <button
                                onClick={() => toggleCurrentIntegration("scheduling")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("scheduling")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("scheduling")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <Calendar className={`w-6 h-6 ${selectedCurrentIntegrations.has("scheduling") ? "text-accent" : "text-primary"}`} />
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Scheduling</span>
                                {selectedCurrentIntegrations.has("scheduling") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Food Menu */}
                              <button
                                onClick={() => toggleCurrentIntegration("foodmenu")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("foodmenu")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("foodmenu")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("foodmenu") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8h12M6 15h12M6 11.5h12M8 5h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Food Menu</span>
                                {selectedCurrentIntegrations.has("foodmenu") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Food Delivery Service */}
                              <button
                                onClick={() => toggleCurrentIntegration("fooddelivery")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("fooddelivery")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("fooddelivery")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("fooddelivery") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Food Delivery</span>
                                {selectedCurrentIntegrations.has("fooddelivery") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Payment Solutions */}
                              <button
                                onClick={() => toggleCurrentIntegration("payments")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("payments")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("payments")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("payments") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Payments</span>
                                {selectedCurrentIntegrations.has("payments") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* CRM */}
                              <button
                                onClick={() => toggleCurrentIntegration("crm")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("crm")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("crm")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("crm") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20v-2a9 9 0 0118 0v2" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">CRM</span>
                                {selectedCurrentIntegrations.has("crm") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Email Newsletter */}
                              <button
                                onClick={() => toggleCurrentIntegration("email")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("email")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("email")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("email") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Email Newsletter</span>
                                {selectedCurrentIntegrations.has("email") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Inventory Management */}
                              <button
                                onClick={() => toggleCurrentIntegration("inventory")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("inventory")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("inventory")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("inventory") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 0v10l8 4" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Inventory</span>
                                {selectedCurrentIntegrations.has("inventory") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Reservations */}
                              <button
                                onClick={() => toggleCurrentIntegration("reservations")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("reservations")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("reservations")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("reservations") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Reservations</span>
                                {selectedCurrentIntegrations.has("reservations") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Social Media */}
                              <button
                                onClick={() => toggleCurrentIntegration("social")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedCurrentIntegrations.has("social")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedCurrentIntegrations.has("social")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedCurrentIntegrations.has("social") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Social Media</span>
                                {selectedCurrentIntegrations.has("social") && (
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
                      </div>
                    )}

                    {/* Page 3: Add-ons */}
                    {websitePage === "page3" && (
                      <div className="space-y-8">
                        <div className="text-center space-y-3">
                          <h2 className="text-3xl font-bold text-foreground">
                            Add-ons
                          </h2>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Select any additional services you'd like to include
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="overflow-x-auto pb-4">
                            <div className="flex gap-4 min-w-max px-1 justify-center">
                              {/* Advanced Analytics */}
                              <button
                                onClick={() => toggleAddon("analytics")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedAddons.has("analytics")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedAddons.has("analytics")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedAddons.has("analytics") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Analytics</span>
                                {selectedAddons.has("analytics") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Email Marketing */}
                              <button
                                onClick={() => toggleAddon("email")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedAddons.has("email")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedAddons.has("email")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedAddons.has("email") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Email Marketing</span>
                                {selectedAddons.has("email") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Live Chat */}
                              <button
                                onClick={() => toggleAddon("livechat")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedAddons.has("livechat")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedAddons.has("livechat")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedAddons.has("livechat") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Live Chat</span>
                                {selectedAddons.has("livechat") && (
                                  <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>

                              {/* Premium Support */}
                              <button
                                onClick={() => toggleAddon("support")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                                  selectedAddons.has("support")
                                    ? "border-accent bg-accent/10"
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                }`}
                              >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                                  selectedAddons.has("support")
                                    ? "bg-accent/20"
                                    : "bg-primary/10"
                                }`}>
                                  <svg className={`w-6 h-6 ${selectedAddons.has("support") ? "text-accent" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-foreground whitespace-nowrap">Premium Support</span>
                                {selectedAddons.has("support") && (
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
                      </div>
                    )}

                    {/* Continue Button */}
                    <div className="pt-4 border-t border-border">
                      <Button
                        onClick={handleWebsitePageContinue}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        {websitePage === "page3" ? "Continue to Confirm →" : "Continue →"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Success Step */}
            {step === "success" && appointment && (
              <BookingConfirmation
                appointment={appointment}
                onNewBooking={handleNewBooking}
                onClose={handleClose}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          {step !== "success" && (
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                onClick={() => {
                  if (step === "website") {
                    if (websitePage !== "page1") {
                      handleWebsitePageBack();
                    } else {
                      setStep("select");
                    }
                  } else if (step === "confirm") {
                    setStep("website");
                    setWebsitePage("page3");
                  }
                }}
                variant="outline"
                disabled={!canGoBack && step !== "website"}
                className={
                  !canGoBack && step !== "website"
                    ? "opacity-50 cursor-not-allowed"
                    : "border-border text-foreground hover:bg-background"
                }
              >
                ← Back
              </Button>

              <p className="text-sm text-muted-foreground">
                {step === "website" ? `Question ${["page1", "page2", "page3"].indexOf(websitePage) + 1} of 3` : `Step ${currentStepIndex + 1} of ${steps.length}`}
              </p>

              {step === "confirm" && (
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
