import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Calendar, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AcuityAppointment } from "@shared/api";

interface RescheduleFormProps {
  appointment: AcuityAppointment;
  onReschedule: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RescheduleForm({
  appointment,
  onReschedule,
  onCancel,
  isLoading = false,
}: RescheduleFormProps) {
  // Parse the appointment datetime
  const appointmentDate = parseISO(appointment.datetime);
  const formattedDate = format(appointmentDate, "MMMM d, yyyy");
  const formattedTime = format(appointmentDate, "h:mm a");

  // Use the actual appointment type name from Acuity API
  const appointmentTypeLabel = appointment.appointmentTypeName || "Appointment";

  return (
    <div className="space-y-6">
      {/* Current Appointment Details */}
      <Card className="p-6 bg-card border-border">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Current Appointment
          </h2>

          {/* Appointment Type */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Appointment Type
              </p>
              <p className="font-medium text-foreground">
                {appointmentTypeLabel}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium text-foreground">
                {formattedTime}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Customer
            </p>
            <p className="text-sm font-medium text-foreground">
              {appointment.firstName} {appointment.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {appointment.email}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onReschedule}
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? "Processing..." : "Select New Date & Time"}
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
