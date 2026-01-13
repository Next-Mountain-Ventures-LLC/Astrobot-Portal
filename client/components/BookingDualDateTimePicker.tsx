import { useState, useMemo } from "react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { Card } from "@/components/ui/card";
import { addDays, parseISO } from "date-fns";

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

  const handleDesignDateSelect = (date: string) => {
    setDesignDate(date);
    setDesignDateTime(null); // Reset time when date changes
  };

  const handleDesignTimeSelect = (datetime: string) => {
    setDesignDateTime(datetime);
  };

  const handleLaunchDateSelect = (date: string) => {
    setLaunchDate(date);
    setLaunchDateTime(null); // Reset time when date changes
  };

  const handleLaunchTimeSelect = (datetime: string) => {
    setLaunchDateTime(datetime);
    // Only trigger callback when both dates and times are selected
    if (designDateTime && datetime) {
      onDatesSelect(designDateTime, datetime);
    }
  };

  const isLaunchDateSelectionEnabled = !!designDate;
  const isLaunchDateTimeVisible = !!launchDate;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Design Meeting */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Design meeting</h3>
        <BookingCalendar
          onDateSelect={handleDesignDateSelect}
          selectedDate={designDate || undefined}
          onError={onError}
          disableDatesBeforeThan={null}
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
        <h3 className="text-xl font-semibold text-foreground">Launch date</h3>
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
