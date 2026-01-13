import { useState } from "react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { TimeSlotSelector } from "@/components/TimeSlotSelector";
import { Card } from "@/components/ui/card";

interface BookingDateTimePickerProps {
  onDateTimeSelect: (datetime: string) => void;
  onError?: (error: string) => void;
}

export function BookingDateTimePicker({
  onDateTimeSelect,
  onError,
}: BookingDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (datetime: string) => {
    onDateTimeSelect(datetime);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Calendar */}
      <div>
        <BookingCalendar
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate || undefined}
          onError={onError}
        />
      </div>

      {/* Right: Time Selector */}
      <div>
        {selectedDate ? (
          <TimeSlotSelector
            selectedDate={selectedDate}
            onTimeSelect={handleTimeSelect}
            onError={onError}
          />
        ) : (
          <Card className="p-6 bg-card border-border h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-lg">
                👈 Select a date to see available times
              </p>
              <p className="text-sm text-muted-foreground">
                Click any available date on the left to get started
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
