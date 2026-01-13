import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  User,
  ArrowRight,
} from "lucide-react";
import { BookingConfirmationResponse } from "@shared/api";

interface BookingConfirmationProps {
  appointment: BookingConfirmationResponse;
  onClose?: () => void;
  onNewBooking?: () => void;
}

export function BookingConfirmation({
  appointment,
  onClose,
  onNewBooking,
}: BookingConfirmationProps) {
  const appointmentDate = new Date(appointment.datetime);

  return (
    <Card className="p-8 bg-card border-border text-center">
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-muted-foreground">
            {appointment.message}
          </p>
        </div>

        {/* Appointment Details */}
        <div className="bg-background rounded-lg border border-border p-6 space-y-4 text-left">
          <h3 className="font-semibold text-foreground text-lg">
            Appointment Details
          </h3>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="text-foreground font-medium">
                {appointmentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-foreground font-medium">
                {appointmentDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>

          {/* Attendee Name */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Attendee</p>
              <p className="text-foreground font-medium">
                {appointment.firstName} {appointment.lastName}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-foreground font-medium">{appointment.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-foreground font-medium">{appointment.phone}</p>
            </div>
          </div>
        </div>

        {/* Confirmation Email Message */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            A confirmation email with all the details has been sent to{" "}
            <span className="font-semibold">{appointment.email}</span>
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-background rounded-lg border border-border p-4">
          <h4 className="font-semibold text-foreground text-sm mb-2">
            What's Next?
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              Check your email for confirmation details
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              Add the appointment to your calendar
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              We'll send you a reminder before the appointment
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onNewBooking && (
            <Button
              onClick={onNewBooking}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-background"
            >
              Schedule Another
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
