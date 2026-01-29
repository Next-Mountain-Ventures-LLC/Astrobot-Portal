import { useState, useMemo } from "react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { Card } from "@/components/ui/card";
import { addDays, parseISO, startOfMonth } from "date-fns";

interface BookingDualDateTimePickerProps {
  onDatesSelect: (designDateTime: string, launchDateTime: string) => void;
  onError?: (error: string) => void;
}

export function BookingDualDateTimePicker({
  onDatesSelect,
  onError,
}: BookingDualDateTimePickerProps) {
  const [designDate, setDesignDate] = useState<string | null>(null);
  const [designDateTime, setDesignDateTime] = useState<string | null>(null);
  const [launchDate, setLaunchDate] = useState<string | null>(null);
  const [launchDateTime, setLaunchDateTime] = useState<string | null>(null);

  // Calculate the earliest date that is 7 days after the design date
  const designDateMinusSevenDays = useMemo(() => {
    if (!designDate) return null;
    try {
      const designDateObj = parseISO(designDate);
      return addDays(designDateObj, 7);
    } catch {
      return null;
    }
  }, [designDate]);

  // Calculate which month the launch calendar should default to
  // If the 7-day constraint date is in a different month, auto-advance to that month
  const launchCalendarInitialMonth = useMemo(() => {
    if (!designDateMinusSevenDays) return undefined;
    return startOfMonth(designDateMinusSevenDays);
  }, [designDateMinusSevenDays]);

  const handleDesignDateSelect = (date: string) => {
    setDesignDate(date);
    setDesignDateTime(null); // Reset time when date changes
  };

  const handleDesignTimeSelect = (datetime: string) => {
    setDesignDateTime(datetime);
    // Check if both times are now selected (launch time might already be set)
    if (launchDateTime) {
      onDatesSelect(datetime, launchDateTime);
    }
  };

  const handleLaunchDateSelect = (date: string) => {
    setLaunchDate(date);
    setLaunchDateTime(null); // Reset time when date changes
  };

  const handleLaunchTimeSelect = (datetime: string) => {
    setLaunchDateTime(datetime);
    // Only trigger callback when both dates and times are selected
    // Check if design time is already selected
    if (designDateTime) {
      onDatesSelect(designDateTime, datetime);
    }
  };

  const isLaunchDateSelectionEnabled = !!designDate;
  const isLaunchDateTimeVisible = !!launchDate;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Design Meeting */}
      <div className="space-y-4">
        <BookingCalendar
          onDateSelect={handleDesignDateSelect}
          selectedDate={designDate || undefined}
          onError={onError}
          disableDatesBeforeThan={null}
          title="Select Designer Meeting"
        />
        {designDate && (
          <TimeSlotSelector
            selectedDate={designDate}
            onTimeSelect={handleDesignTimeSelect}
            onError={onError}
          />
        )}
      </div>

      {/* Right: Launch Meeting */}
      <div className="space-y-4">
        {!isLaunchDateSelectionEnabled ? (
          <Card className="p-8 bg-card border-border h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-lg">
                👈 Select a design meeting date first
              </p>
              <p className="text-sm text-muted-foreground">
                We'll show you available launch dates (at least 7 days later)
              </p>
            </div>
          </Card>
        ) : (
          <>
            <BookingCalendar
              onDateSelect={handleLaunchDateSelect}
              selectedDate={launchDate || undefined}
              onError={onError}
              disableDatesBeforeThan={designDateMinusSevenDays}
              title="Select Launch Meeting"
              initialMonth={launchCalendarInitialMonth}
            />
            {isLaunchDateTimeVisible && (
              <TimeSlotSelector
                selectedDate={launchDate}
                onTimeSelect={handleLaunchTimeSelect}
                onError={onError}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
