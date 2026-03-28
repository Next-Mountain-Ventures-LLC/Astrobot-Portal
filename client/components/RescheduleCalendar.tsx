import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { format, parseISO, addDays } from "date-fns";

interface RescheduleCalendarProps {
  onDateTimeSelect: (datetime: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  // Dates before this cannot be selected (for 7-day design->launch constraint)
  disableDatesBeforeThan?: Date | null;
  // For launch appointment rescheduling
  appointmentTypeId?: string;
}

export function RescheduleCalendar({
  onDateTimeSelect,
  onCancel,
  isLoading = false,
  disableDatesBeforeThan,
  appointmentTypeId,
}: RescheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedDateTime(null);
    setError(null);
  };

  const handleTimeSelect = (datetime: string) => {
    setSelectedDateTime(datetime);
  };

  const handleConfirm = () => {
    if (selectedDateTime) {
      onDateTimeSelect(selectedDateTime);
    }
  };

  const hasSelectedBoth = selectedDate && selectedDateTime;

  return (
    <div className="space-y-6">
      {/* Calendar to select date */}
      <BookingCalendar
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate || undefined}
        onError={setError}
        disableDatesBeforeThan={disableDatesBeforeThan}
        title="Select New Date"
        appointmentTypeId={appointmentTypeId}
      />

      {/* Time selector (shows only after date is selected) */}
      {selectedDate && (
        <TimeSlotSelector
          selectedDate={selectedDate}
          onTimeSelect={handleTimeSelect}
          onError={setError}
          appointmentTypeId={appointmentTypeId}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Error loading availability
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Selected date/time summary */}
      {selectedDateTime && (
        <Card className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-900 dark:text-green-200">
              Selected Date & Time
            </p>
            <p className="text-base font-semibold text-green-800 dark:text-green-100">
              {format(parseISO(selectedDateTime), "MMMM d, yyyy")} at{" "}
              {format(parseISO(selectedDateTime), "h:mm a")}
            </p>
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleConfirm}
          disabled={!hasSelectedBoth || isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? "Processing..." : "Confirm New Time"}
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
