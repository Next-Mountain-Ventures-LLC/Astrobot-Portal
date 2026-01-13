import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, Loader2 } from "lucide-react";
import { AvailabilityTimesResponse } from "@shared/api";

interface TimeSlotsProps {
  selectedDate: string;
  onTimeSelect: (datetime: string) => void;
  onError?: (error: string) => void;
}

export function TimeSlotSelector({
  selectedDate,
  onTimeSelect,
  onError,
}: TimeSlotsProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Fetch available times for selected date
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["availability-times", selectedDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/booking/availability/times?date=${selectedDate}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to fetch available times"
        );
      }
      return (await res.json()) as AvailabilityTimesResponse;
    },
    enabled: !!selectedDate,
  });

  useEffect(() => {
    if (error && onError) {
      onError(error.message || "Failed to fetch available times");
    }
  }, [error, onError]);

  const timeSlots = response?.times || [];
  const hasAvailability = timeSlots.length > 0;

  const handleTimeSelect = (datetime: string) => {
    setSelectedTime(datetime);
    onTimeSelect(datetime);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Select Time</h3>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading available times...</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Unable to load times
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

        {!isLoading && !error && !hasAvailability && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No availability for this date. Please select another date.
            </p>
          </div>
        )}

        {!isLoading && !error && hasAvailability && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {timeSlots.map((slot) => {
              const time = new Date(slot.datetime);
              const timeString = time.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              const isSelected = selectedTime === slot.datetime;

              return (
                <Button
                  key={slot.datetime}
                  onClick={() => handleTimeSelect(slot.datetime)}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full h-auto py-3 ${
                    isSelected
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground border-accent"
                      : "border-border hover:border-primary text-foreground"
                  }`}
                >
                  <div className="text-sm font-medium">{timeString}</div>
                </Button>
              );
            })}
          </div>
        )}

        {selectedTime && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
            <p className="text-sm text-foreground">
              <span className="font-semibold">Selected time:</span>{" "}
              {new Date(selectedTime).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
