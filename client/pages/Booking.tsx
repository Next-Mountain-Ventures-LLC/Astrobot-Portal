import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { BookingDualDateTimePicker } from "@/components/BookingDualDateTimePicker";
import { BookingForm, type BookingFormData } from "@/components/BookingForm";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { useApiLog } from "@/hooks/use-api-log";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Calendar, User, CreditCard, Share2, Users } from "lucide-react";
import { BookingConfirmationResponse } from "@shared/api";

type Step = "select" | "website" | "confirm";

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

  // Stripe session data for auto-filling form
  const [stripeSessionData, setStripeSessionData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [isLoadingStripeSession, setIsLoadingStripeSession] = useState(false);

  // Domain input for website redesign or domain selection
  const [domain, setDomain] = useState<string>("");

  const { logRequest, logResponse, logError } = useApiLog();

  // Helper: Check if "Website Redesign" is selected
  const isWebsiteRedesign = selectedQuestions.has("redesign");

  // Helper: Check if domain ownership is mentioned
  const hasOwnDomain = selectedQuestions.has("own-domain");
  const knowsDesiredDomain = selectedQuestions.has("know-domain");

  // Helper: Determine Page 2 subtitle
  const getPage2Subtitle = () => {
    if (isWebsiteRedesign) {
      return "Tell us about your current website";
    }
    return "Tell us about your brand";
  };

  // Helper: Determine domain input placeholder
  const getDomainPlaceholder = () => {
    if (isWebsiteRedesign) {
      return "example.com";
    }
    if (hasOwnDomain) {
      return "Insert your domain here";
    }
    if (knowsDesiredDomain) {
      return "Enter domain that you would like us to check for";
    }
    return "";
  };

  // Helper: Determine domain label
  const getDomainLabel = () => {
    if (isWebsiteRedesign) {
      return "Domain of current website";
    }
    if (hasOwnDomain || knowsDesiredDomain) {
      return "Desired domain for your website";
    }
    return "";
  };

  // Fetch Stripe session data when reaching confirm step
  useEffect(() => {
    if (step === "confirm" && !stripeSessionData) {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (sessionId && sessionId.startsWith("cs_")) {
        setIsLoadingStripeSession(true);
        console.log("[Booking] Fetching Stripe session data:", sessionId);

        fetch(`/api/booking/stripe-session/${sessionId}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to retrieve session: ${res.statusText}`);
            }
            return res.json();
          })
          .then((data) => {
            console.log("[Booking] Successfully retrieved Stripe session data:", {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
            });
            setStripeSessionData(data);
            setIsLoadingStripeSession(false);
          })
          .catch((error) => {
            console.error("[Booking] Error fetching Stripe session:", error);
            setIsLoadingStripeSession(false);
            // Don't set error state - let user continue manually
          });
      }
    }
  }, [step, stripeSessionData]);

  const toggleQuestion = (question: string) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(question)) {
      newSet.delete(question);
    } else {
      newSet.add(question);
    }
    setSelectedQuestions(newSet);
  };

  // Toggle website type (mutually exclusive: brand-new OR redesign, but can also be unselected)
  const toggleWebsiteType = (type: "brand-new" | "redesign") => {
    const newSet = new Set(selectedQuestions);
    // If clicking the same one that's already selected, deselect it
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      // Otherwise, remove both and add the new one
      newSet.delete("brand-new");
      newSet.delete("redesign");
      newSet.add(type);
    }
    setSelectedQuestions(newSet);
  };

  // Toggle domain ownership (mutually exclusive: own-domain OR know-domain, but can also be unselected)
  const toggleDomainOwnership = (type: "own-domain" | "know-domain") => {
    const newSet = new Set(selectedQuestions);
    // If clicking the same one that's already selected, deselect it
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      // Otherwise, remove both and add the new one
      newSet.delete("own-domain");
      newSet.delete("know-domain");
      newSet.add(type);
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

  /**
   * IMPORTANT: Form Data to Appointment Notes Pattern
   *
   * All form data collected in this booking flow is passed through to the appointment
   * notes in Acuity Scheduling. This ensures designers and team members have complete
   * context when they receive appointment notifications.
   *
   * WHEN ADDING NEW FORM FIELDS:
   * 1. Add the new field to the appropriate state (selectedQuestions, selectedCurrentIntegrations, or selectedAddons)
   * 2. Add a corresponding label mapping in the appropriate getLabel function below
   * 3. Update the designNotesContent compilation in the createAppointmentMutation to include the new field
   * 4. The system will automatically capture and pass the data through to Acuity
   *
   * This pattern ensures no data is lost and all information flows to the appointment notes
   * without requiring manual updates to multiple locations.
   */

  // Label mappings for questions, integrations, and interests
  // IMPORTANT: Keep these in sync with form fields and add new selections here
  const getQuestionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      "brand-new": "Brand New Website",
      "redesign": "Website Redesign",
      "own-domain": "I own the domain already",
      "know-domain": "I need to buy a domain",
      "seo": "I need Search Engine Optimization Services",
      "traffic": "I already know where my traffic will be coming from",
      // ADD NEW QUESTION SELECTIONS HERE
    };
    return labels[key] || key;
  };

  const getIntegrationLabel = (key: string): string => {
    const labels: Record<string, string> = {
      "payments": "Payments",
      "leadforms": "Lead Forms",
      "social": "Social Media",
      "email": "Email Newsletter",
      "scheduling": "Scheduling",
      "ecommerce": "E-commerce",
      "crm": "CRM",
      "events": "Events / Event Calendar",
      "reservations": "Reservations",
      "subscriptions": "Subscriptions / Memberships",
      "inventory": "Inventory",
      "foodmenu": "Food Menu",
      "fooddelivery": "Food Delivery",
      "automation": "Automation Workflows",
      // ADD NEW INTEGRATION SELECTIONS HERE
    };
    return labels[key] || key;
  };

  const getIntegrationDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      "payments": "We accept payments through our website.",
      "leadforms": "Customers submit inquiries through our site.",
      "social": "We connect or display our social channels.",
      "email": "We collect subscribers and send email campaigns.",
      "scheduling": "Customers book appointments on our site.",
      "ecommerce": "We sell products online.",
      "crm": "We send customer information to our CRM.",
      "events": "We display or manage events on our website.",
      "reservations": "Customers reserve tables or spots online.",
      "subscriptions": "We offer recurring plans or member access.",
      "inventory": "We display product or item availability.",
      "foodmenu": "We display our menu online.",
      "fooddelivery": "We accept online delivery orders.",
      "automation": "We send automated confirmations or follow-ups.",
    };
    return descriptions[key] || "";
  };

  // State for hover tooltip
  const [hoveredIntegration, setHoveredIntegration] = useState<string | null>(null);

  // Integration options data - organized into two rows for better visual balance
  // Row 1: Commerce & Transactions (e-commerce, payments, subscriptions, food, inventory, reservations)
  // Row 2: Customer Engagement (scheduling, lead forms, email, social, CRM, events, automation)
  const integrationRow1 = [
    { id: "ecommerce", label: "E-commerce" },
    { id: "payments", label: "Payments" },
    { id: "subscriptions", label: "Subscriptions / Memberships" },
    { id: "foodmenu", label: "Food Menu" },
    { id: "fooddelivery", label: "Food Delivery" },
    { id: "inventory", label: "Inventory" },
    { id: "reservations", label: "Reservations" },
  ];

  const integrationRow2 = [
    { id: "scheduling", label: "Scheduling" },
    { id: "leadforms", label: "Lead Forms" },
    { id: "email", label: "Email Newsletter" },
    { id: "social", label: "Social Media" },
    { id: "crm", label: "CRM" },
    { id: "events", label: "Events / Event Calendar" },
    { id: "automation", label: "Automation Workflows" },
  ];

  // Helper to render icon for each integration
  const renderIntegrationIcon = (id: string, isSelected: boolean): React.ReactNode => {
    const iconClass = `w-6 h-6 ${isSelected ? "text-accent" : "text-primary"}`;

    switch (id) {
      case "payments":
        return <CreditCard className={iconClass} />;
      case "leadforms":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case "social":
        return <Share2 className={iconClass} />;
      case "email":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case "scheduling":
        return <Calendar className={iconClass} />;
      case "ecommerce":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
      case "crm":
        return <Users className={iconClass} />;
      case "events":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case "reservations":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case "subscriptions":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case "inventory":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 0v10l8 4" /></svg>;
      case "foodmenu":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8h12M6 15h12M6 11.5h12M8 5h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>;
      case "fooddelivery":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case "automation":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default:
        return null;
    }
  };

  const getInterestLabel = (key: string): string => {
    const labels: Record<string, string> = {
      "analytics": "Advanced Analytics",
      "email": "Email Marketing",
      "livechat": "Live Chat",
      "support": "Premium Support",
      "seo": "SEO Services",
      "branding": "Advanced Branding",
      "training": "Staff Training",
      // ADD NEW INTEREST SELECTIONS HERE
    };
    return labels[key] || key;
  };

  // Mutation for creating appointment
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData & { datetime: string; launchDateTime: string }) => {
      const startTime = performance.now();

      // Convert selected items to display labels using the mapping functions
      // This ensures all form data is passed through with human-readable labels
      const questionsWithLabels = Array.from(selectedQuestions).map((q) => getQuestionLabel(q)).filter(Boolean);
      const integrationsWithLabels = Array.from(selectedCurrentIntegrations).map((i) => getIntegrationLabel(i)).filter(Boolean);
      const interestsWithLabels = Array.from(selectedAddons).map((a) => getInterestLabel(a)).filter(Boolean);

      /**
       * Build design meeting appointment notes with all collected information.
       *
       * IMPORTANT: ALL FORM DATA MUST BE PASSED HERE
       * Every field users fill out in this booking flow should be included in these notes.
       * This ensures designers and team members receive complete context when Acuity sends notifications.
       *
       * NOTE: Uses ~ as separator instead of : to prevent JSON parsing issues in API requests
       *
       * WHEN ADDING NEW FORM FIELDS:
       * 1. Collect the field data into state (like selectedQuestions, selectedCurrentIntegrations, etc.)
       * 2. Create or update a label mapping function (getQuestionLabel, getIntegrationLabel, etc.)
       * 3. Add a line here that includes the field data in designNotesContent array
       * 4. Follow the format: `[Section Name] ~ ${values.join(", ")}`
       * 5. The data will automatically flow through to the Acuity appointment
       */
      const designNotesContent = [
        data.notes ? `Additional Notes ~ ${data.notes}` : "Additional Notes ~ None provided",
        "",
        questionsWithLabels.length > 0
          ? `Questions From Designer ~ ${questionsWithLabels.join(", ")}`
          : "Questions From Designer ~ None selected",
        "",
        integrationsWithLabels.length > 0
          ? `Current Website or Business Integrations ~ ${integrationsWithLabels.join(", ")}`
          : "Current Website or Business Integrations ~ None selected",
        "",
        interestsWithLabels.length > 0
          ? `Possibly Interested In ~ ${interestsWithLabels.join(", ")}`
          : "Possibly Interested In ~ None selected",
        ...(domain ? ["", `Domain ~ ${domain}`] : []),
        // ADD NEW FORM FIELDS HERE - follow the pattern above
      ].join("\n");

      // Create design meeting appointment (uses ACUITY_APPOINTMENT_TYPE_ID from env)
      const designAppointmentData = {
        ...data,
        datetime: data.datetime,
        timezone: "America/Chicago",
        notes: designNotesContent,
      };

      const designLogId = logRequest("POST", "/api/booking/appointments", designAppointmentData);
      let launchLogId: string | null = null;

      try {
        const designRes = await fetch("/api/booking/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(designAppointmentData),
        });

        const designDuration = Math.round(performance.now() - startTime);

        if (!designRes.ok) {
          const errorData = await designRes.json();
          const errorMessage = errorData.message || "Failed to create design appointment";
          logError(designLogId, errorMessage, designDuration);
          throw new Error(errorMessage);
        }

        const designAppointment = (await designRes.json()) as BookingConfirmationResponse;
        logResponse(designLogId, designRes.status, designRes.statusText, designAppointment, designDuration);

        // Create launch meeting appointment (uses appointment type 89122426)
        const launchAppointmentData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          datetime: data.launchDateTime,
          timezone: "America/Chicago",
          appointmentTypeId: "89122426",
          notes: "Launch week meeting ~ prepared for go-live discussion",
        };

        launchLogId = logRequest("POST", "/api/booking/appointments", launchAppointmentData);

        const launchRes = await fetch("/api/booking/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(launchAppointmentData),
        });

        const launchDuration = Math.round(performance.now() - startTime);

        if (!launchRes.ok) {
          const errorData = await launchRes.json();
          const errorMessage = errorData.message || "Failed to create launch appointment";
          logError(launchLogId, errorMessage, launchDuration);
          throw new Error(errorMessage);
        }

        const launchAppointment = (await launchRes.json()) as BookingConfirmationResponse;
        logResponse(launchLogId, launchRes.status, launchRes.statusText, launchAppointment, launchDuration);

        // Return the design appointment as the main response
        return designAppointment;
      } catch (err: any) {
        const duration = Math.round(performance.now() - startTime);
        if (launchLogId) {
          logError(launchLogId, err.message || "Failed to create appointments", duration);
        } else {
          logError(designLogId, err.message || "Failed to create appointments", duration);
        }
        throw err;
      }
    },
    onSuccess: (data) => {
      setAppointment(data);
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

    // Book both appointments with gathered information
    createAppointmentMutation.mutate({
      ...formData,
      datetime: designDateTime,
      launchDateTime: launchDateTime,
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
                <>
                  {appointment ? (
                    <BookingConfirmation
                      appointment={appointment}
                      onNewBooking={handleNewBooking}
                      onClose={handleClose}
                    />
                  ) : (
                    <Card className="p-6 bg-background border-border">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Designer Profile & Schedule Section */}
                        <div className="lg:col-span-1 space-y-6">
                          {/* Your Designer Title */}
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                            Your Designer:
                          </h3>
                          {/* Designer Profile Card */}
                          <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-primary/10 border border-primary/40">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary flex-shrink-0 flex items-center justify-center">
                              <img
                                src="https://cdn.builder.io/api/v1/image/assets%2F5193f7a05d654f0c98a0a70f48ef2387%2F1c2ef5aa27404395a1e9349fa8a03536?format=webp&width=800&height=1200"
                                alt="Joshua Ford"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-center">
                              <h4 className="font-semibold text-foreground">Joshua Ford</h4>
                              <p className="text-sm text-muted-foreground">Lead Designer at Astro Bot</p>
                            </div>
                          </div>

                          <div className="border-t border-border pt-6 w-full flex flex-col items-center">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                              Your appointments:
                            </h3>

                            {/* Date Cards Container with more spacing */}
                            <div className="space-y-8 flex flex-col items-center">
                              {/* Design Meeting Calendar Card */}
                              <button
                                onClick={() => setStep("select")}
                                className="flex flex-col items-center gap-3 p-2 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                              >
                                <div className="relative w-36 h-32 bg-primary/10 group-hover:bg-primary/20 border-2 border-primary rounded-lg p-3 flex flex-col justify-between transition-all">
                                  <div className="text-xs font-bold text-primary uppercase whitespace-normal">
                                    Design
                                  </div>
                                  <div className="text-3xl font-bold text-foreground">
                                    {new Date(designDateTime).getDate()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
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
                                className="flex flex-col items-center gap-3 p-2 rounded-lg border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                              >
                                <div className="relative w-36 h-32 bg-primary/10 group-hover:bg-primary/20 border-2 border-primary rounded-lg p-3 flex flex-col justify-between transition-all">
                                  <div className="text-xs font-bold text-primary uppercase whitespace-normal">
                                    Launch
                                  </div>
                                  <div className="text-3xl font-bold text-foreground">
                                    {new Date(launchDateTime).getDate()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
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
                        </div>

                        {/* Right: Form Section */}
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center mb-6">
                            Confirm Your Details
                          </h4>
                          {isLoadingStripeSession && (
                            <div className="p-3 mb-4 bg-primary/10 border border-primary/30 rounded-md">
                              <p className="text-sm text-primary">Loading your information...</p>
                            </div>
                          )}
                          <BookingForm
                            onSubmit={handleFormSubmit}
                            isLoading={createAppointmentMutation.isPending}
                            initialValues={stripeSessionData || undefined}
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </>
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
                              onClick={() => toggleWebsiteType("brand-new")}
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
                              onClick={() => toggleWebsiteType("redesign")}
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

                            {/* I own the domain already */}
                            <button
                              onClick={() => toggleDomainOwnership("own-domain")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("own-domain")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I own the domain already.</span>
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
                              onClick={() => toggleDomainOwnership("know-domain")}
                              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all relative ${
                                selectedQuestions.has("know-domain")
                                  ? "border-accent bg-accent/10"
                                  : "border-primary/20 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              <span className="text-sm font-medium text-foreground flex-1 text-left">I need to buy a domain.</span>
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
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Page 2: Current Integrations */}
                    {websitePage === "page2" && (
                      <div className="space-y-8">
                        <div className="text-center space-y-3">
                          <h2 className="text-3xl font-bold text-foreground">
                            Tell us what we are building.
                          </h2>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            What will you need your website to do?
                          </p>
                        </div>

                        {/* Conditional Domain Input */}
                        {(isWebsiteRedesign || hasOwnDomain || knowsDesiredDomain) && (
                          <div className="max-w-md mx-auto">
                            <label className="block text-sm font-medium text-foreground mb-2">
                              {getDomainLabel()}
                            </label>
                            <input
                              type="text"
                              value={domain}
                              onChange={(e) => setDomain(e.target.value)}
                              placeholder={getDomainPlaceholder()}
                              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        )}

                        <div className="space-y-6">
                          {/* Row 1: Commerce & Transactions */}
                          <div className="relative">
                            <div className="pb-4 overflow-x-auto scrollbar-hide">
                              <div className="flex gap-4 min-w-max px-4 justify-center">
                                {integrationRow1.map((option) => (
                                  <button
                                    key={option.id}
                                    onClick={() => toggleCurrentIntegration(option.id)}
                                    onMouseEnter={() => setHoveredIntegration(option.id)}
                                    onMouseLeave={() => setHoveredIntegration(null)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all relative w-40 h-40 flex-shrink-0 ${
                                      selectedCurrentIntegrations.has(option.id)
                                        ? "border-accent bg-accent/10"
                                        : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                    }`}
                                  >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                      selectedCurrentIntegrations.has(option.id)
                                        ? "bg-accent/20"
                                        : "bg-primary/10"
                                    }`}>
                                      {renderIntegrationIcon(option.id, selectedCurrentIntegrations.has(option.id))}
                                    </div>
                                    <span className="text-xs font-medium text-foreground text-center">
                                      {getIntegrationLabel(option.id)}
                                    </span>
                                    <p className={`text-xs text-muted-foreground text-center leading-tight transition-all flex-1 ${
                                      hoveredIntegration === option.id ? "" : "line-clamp-2"
                                    }`}>
                                      {getIntegrationDescription(option.id)}
                                    </p>
                                    {selectedCurrentIntegrations.has(option.id) && (
                                      <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Scroll indicator arrows */}
                            <svg className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 animate-pulse pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <svg className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 animate-pulse pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>

                          {/* Row 2: Customer Engagement & Communication */}
                          <div className="relative">
                            <div className="pb-4 overflow-x-auto scrollbar-hide">
                              <div className="flex gap-4 min-w-max px-4 justify-center">
                                {integrationRow2.map((option) => (
                                  <button
                                    key={option.id}
                                    onClick={() => toggleCurrentIntegration(option.id)}
                                    onMouseEnter={() => setHoveredIntegration(option.id)}
                                    onMouseLeave={() => setHoveredIntegration(null)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all relative w-40 h-40 flex-shrink-0 ${
                                      selectedCurrentIntegrations.has(option.id)
                                        ? "border-accent bg-accent/10"
                                        : "border-primary/20 hover:border-primary hover:bg-primary/5"
                                    }`}
                                  >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                                      selectedCurrentIntegrations.has(option.id)
                                        ? "bg-accent/20"
                                        : "bg-primary/10"
                                    }`}>
                                      {renderIntegrationIcon(option.id, selectedCurrentIntegrations.has(option.id))}
                                    </div>
                                    <span className="text-xs font-medium text-foreground text-center">
                                      {getIntegrationLabel(option.id)}
                                    </span>
                                    <p className={`text-xs text-muted-foreground text-center leading-tight transition-all flex-1 ${
                                      hoveredIntegration === option.id ? "" : "line-clamp-2"
                                    }`}>
                                      {getIntegrationDescription(option.id)}
                                    </p>
                                    {selectedCurrentIntegrations.has(option.id) && (
                                      <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Scroll indicator arrows */}
                            <svg className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 animate-pulse pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <svg className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 animate-pulse pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Page 3: Possibly Interested In */}
                    {websitePage === "page3" && (
                      <div className="space-y-8">
                        <div className="text-center space-y-3">
                          <h2 className="text-3xl font-bold text-foreground">
                            Possibly Interested In
                          </h2>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Select things you might be interested in exploring
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

          </div>

          {/* Navigation Buttons */}
          {!appointment && (
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

        </div>
      </div>
    </Layout>
  );
}
