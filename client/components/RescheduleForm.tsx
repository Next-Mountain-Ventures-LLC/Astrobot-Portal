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

  // Determine appointment type label
  const appointmentTypeLabel =
    appointment.appointmentTypeID === 87852183
      ? "Design Meeting"
      : appointment.appointmentTypeID === 89122426
        ? "Launch Meeting"
        : appointment.appointmentTypeName || "Appointment";

  return (
    <div className="space-y-6">
      {/* Current Appointment Details */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Current Appointment
          </h2>

          {/* Appointment Type */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Appointment Type
              </p>
              <p className="font-medium text-slate-900 dark:text-white">
                {appointmentTypeLabel}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Time</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {formattedTime}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              Customer
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {appointment.firstName} {appointment.lastName}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
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
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
