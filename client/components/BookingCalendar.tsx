import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AvailabilityDatesResponse } from "@shared/api";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parse } from "date-fns";
import { useApiLog } from "@/hooks/use-api-log";

interface BookingCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  onError?: (error: string) => void;
}

export function BookingCalendar({
  onDateSelect,
  selectedDate,
  onError,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const monthString = format(currentMonth, "yyyy-MM");

  // Fetch available dates for the current month
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["availability-dates", monthString],
    queryFn: async () => {
      try {
        const url = `/api/booking/availability/dates?month=${monthString}`;
        console.log("[BookingCalendar] Fetching from URL:", url);

        const res = await fetch(url);

        console.log("[BookingCalendar] Fetch response status:", res.status, res.statusText);

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If response isn't JSON, use generic message
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("[BookingCalendar] Fetch successful, received:", data);
        return data as AvailabilityDatesResponse;
      } catch (err: any) {
        console.error("[BookingCalendar] Fetch error:", err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (error && onError) {
      onError(error.message || "Failed to fetch available dates");
    }
  }, [error, onError]);

  // Debug logging to understand data flow
  useEffect(() => {
    console.log("[BookingCalendar] Query state:", {
      isLoading,
      hasError: !!error,
      responseExists: !!response,
      datesCount: response?.dates?.length,
      rawResponse: response,
    });

    if (response?.dates) {
      console.log("[BookingCalendar] Received available dates:", {
        count: response.dates.length,
        datesList: response.dates.map((d) => `${d.date} (available: ${d.available})`),
      });
    }
  }, [response, isLoading, error]);

  const availableDates = new Set(
    (response?.dates || [])
      .filter((d) => d.available === true || d.available === undefined)
      .map((d) => d.date)
  );

  console.log("[BookingCalendar] Available dates set:", {
    size: availableDates.size,
    dates: Array.from(availableDates),
    allResponseDates: response?.dates?.map((d) => ({ date: d.date, available: d.available })),
  });

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDateSelect = (date: string) => {
    onDateSelect(date);
  };

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Get the day of the week the month starts on (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = start.getDay();

  // Create empty cells for days before month starts
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const allCalendarDays = [...emptyDays, ...days];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Select Date
            </h3>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-background rounded-lg p-3 border border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <h4 className="text-sm font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h4>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Unable to load availability
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                {error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        )}

        {/* Day Headers */}
        {!isLoading && !error && (
          <>
            {/* Available Dates Count */}
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                ✓ <span className="text-primary">{availableDates.size} dates available</span> in {format(currentMonth, "MMMM yyyy")}
              </p>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {allCalendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const dateString = format(day, "yyyy-MM-dd");
                const isAvailable = availableDates.has(dateString);
                const isSelected = selectedDate === dateString;
                const isCurrentDay = isToday(day);
                const isSameMonthDay = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={dateString}
                    onClick={() => handleDateSelect(dateString)}
                    disabled={!isAvailable || !isSameMonthDay}
                    className={`aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-all relative ${
                      !isSameMonthDay
                        ? "text-muted-foreground cursor-default opacity-30"
                        : !isAvailable
                          ? "text-muted-foreground cursor-not-allowed opacity-30 bg-muted"
                          : isSelected
                            ? "bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer font-bold shadow-md"
                            : "bg-primary/20 text-foreground border border-primary/50 hover:bg-primary/30 hover:border-primary cursor-pointer font-semibold"
                    }`}
                  >
                    {format(day, "d")}
                    {isCurrentDay && (
                      <div className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Selected date:</span>{" "}
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Availability Legend */}
            <div className="mt-4 text-xs text-muted-foreground space-y-1.5">
              <p className="flex items-center">
                <span className="inline-block w-3 h-3 bg-accent rounded mr-2"></span>
                <span className="text-foreground font-medium">Selected</span>
              </p>
              <p className="flex items-center">
                <span className="inline-block w-3 h-3 bg-primary/20 border border-primary/50 rounded mr-2"></span>
                <span className="text-foreground font-medium">Available for booking</span>
              </p>
              <p className="flex items-center">
                <span className="inline-block w-3 h-3 bg-muted rounded opacity-50 mr-2"></span>
                <span>Fully booked</span>
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
