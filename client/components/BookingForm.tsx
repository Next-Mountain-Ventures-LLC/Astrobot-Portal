import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

// Validation schema
const bookingFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\d{10,}$/, "Phone must be at least 10 digits"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BookingForm({
  onSubmit,
  isLoading = false,
}: BookingFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  });

  const onSubmitHandler = async (data: BookingFormData) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error: any) {
      setSubmitError(
        error.message || "An error occurred while submitting the form"
      );
    }
  };

  const isDisabled = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {submitError}
              </p>
            </div>
          )}

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-foreground">
              First Name <span className="text-accent">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              disabled={isDisabled}
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.firstName ? "border-red-500" : ""
              }`}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-foreground">
              Last Name <span className="text-accent">*</span>
            </Label>
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              disabled={isDisabled}
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.lastName ? "border-red-500" : ""
              }`}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email <span className="text-accent">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register("email")}
              disabled={isDisabled}
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">
              Phone Number <span className="text-accent">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="(555) 123-4567"
              {...register("phone")}
              disabled={isDisabled}
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                errors.phone ? "border-red-500" : ""
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Additional Notes
            </Label>
            <textarea
              id="notes"
              placeholder="Tell us anything else you'd like us to know..."
              {...register("notes")}
              disabled={isDisabled}
              className="w-full p-3 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-24 resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium mt-6"
          >
            {isDisabled ? "Completing Booking..." : "Complete Booking"}
          </Button>
    </form>
  );
}

export type { BookingFormData };
