import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, Clock } from "lucide-react";

interface SSLStatusProps {
  status?: "active" | "pending" | "expired" | "none";
  onRequestChange?: () => void;
}

export function SSLStatus({ status = "active", onRequestChange }: SSLStatusProps) {
  const getStatusColor = (
    status: "active" | "pending" | "expired" | "none"
  ): { bg: string; text: string; icon: JSX.Element } => {
    switch (status) {
      case "active":
        return {
          bg: "bg-green-500/20",
          text: "text-green-500",
          icon: <Lock className="w-5 h-5" />,
        };
      case "pending":
        return {
          bg: "bg-yellow-500/20",
          text: "text-yellow-500",
          icon: <Clock className="w-5 h-5" />,
        };
      case "expired":
        return {
          bg: "bg-red-500/20",
          text: "text-red-500",
          icon: <AlertCircle className="w-5 h-5" />,
        };
      case "none":
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          icon: <AlertCircle className="w-5 h-5" />,
        };
      default:
        return {
          bg: "bg-gray-500/20",
          text: "text-gray-500",
          icon: <Lock className="w-5 h-5" />,
        };
    }
  };

  const statusInfo = getStatusColor(status);

  const getDescription = () => {
    switch (status) {
      case "active":
        return "Your SSL certificate is active and secure.";
      case "pending":
        return "Your SSL certificate is being set up. This usually takes a few minutes.";
      case "expired":
        return "Your SSL certificate has expired. Please request a renewal.";
      case "none":
        return "No SSL certificate is currently configured.";
      default:
        return "SSL status unknown.";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "expired":
        return "Expired";
      case "none":
        return "Not Configured";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">SSL Certificate</h3>
          </div>
          <Badge className={`${statusInfo.bg} ${statusInfo.text} border-0`}>
            {getStatusLabel()}
          </Badge>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="p-4 bg-background border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <div className={`${statusInfo.text} mt-0.5`}>{statusInfo.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Certificate Status</p>
                <p className="text-sm text-muted-foreground">{getDescription()}</p>
              </div>
            </div>
          </div>

          {/* Auto-Renewal Info */}
          {status === "active" && (
            <div className="text-xs text-muted-foreground p-3 bg-primary/5 rounded-md">
              ✓ Your certificate auto-renews 30 days before expiration
            </div>
          )}

          {/* Action Button */}
          {(status === "expired" || status === "none") && (
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={onRequestChange}
            >
              Request SSL Setup
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
