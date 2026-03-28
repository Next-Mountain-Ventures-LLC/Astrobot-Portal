import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AcuityAppointment } from "@shared/api";

interface RescheduleDualPromptProps {
  launchAppointment: AcuityAppointment;
  newDesignDateTime: string; // New design appointment datetime
  onSelectLaunchDate: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RescheduleDualPrompt({
  launchAppointment,
  newDesignDateTime,
  onSelectLaunchDate,
  onCancel,
  isLoading = false,
}: RescheduleDualPromptProps) {
  // Parse dates
  const launchDate = parseISO(launchAppointment.datetime);
  const designDate = parseISO(newDesignDateTime);

  const launchFormattedDate = format(launchDate, "MMMM d, yyyy");
  const launchFormattedTime = format(launchDate, "h:mm a");

  const designFormattedDate = format(designDate, "MMMM d, yyyy");
  const designFormattedTime = format(designDate, "h:mm a");

  // Calculate days between
  const daysUntilLaunch = Math.ceil(
    (launchDate.getTime() - designDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Warning Card */}
      <Card className="p-6 bg-destructive/10 border border-destructive/30">
        <div className="flex gap-4">
          <div className="flex-shrink-0 pt-0.5">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Launch Meeting Conflict
            </h2>
            <p className="text-destructive/90 mb-2">
              Your new design meeting is now scheduled{" "}
              <span className="font-semibold">{daysUntilLaunch} days</span> before your launch
              meeting. According to your requirements, both appointments must be at least 7 days
              apart.
            </p>
            <p className="text-sm text-destructive/80">
              Please reschedule your launch meeting to maintain the required time gap.
            </p>
          </div>
        </div>
      </Card>

      {/* Appointment Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Design Meeting */}
        <Card className="p-5 border-2 border-primary/30 bg-primary/5">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">
              Design Meeting (New)
            </h3>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-foreground">{designFormattedDate}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-foreground">{designFormattedTime}</span>
            </div>
          </div>
        </Card>

        {/* Launch Meeting */}
        <Card className="p-5 border-2 border-accent/30 bg-accent/5">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-accent">
              Launch Meeting (Current)
            </h3>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-foreground">
                {launchFormattedDate}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-foreground">{launchFormattedTime}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Required Gap Info */}
      <Card className="p-4 bg-muted border border-border">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Required time gap: At least 7 days
          </p>
          <p className="text-xs text-muted-foreground">
            The launch meeting must be scheduled 7 or more days after the design meeting.
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSelectLaunchDate}
          disabled={isLoading}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Processing..." : "Select New Launch Date"}
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
