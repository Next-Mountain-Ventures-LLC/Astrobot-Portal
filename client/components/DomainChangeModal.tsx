import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DomainChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentDomain?: string;
}

export function DomainChangeModal({
  open,
  onOpenChange,
  projectId,
  currentDomain = "example.com",
}: DomainChangeModalProps) {
  const [newDomain, setNewDomain] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidDomain = (domain: string) => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newDomain.trim()) {
      setError("New domain is required");
      return;
    }

    if (!reason.trim()) {
      setError("Please select a reason for the change");
      return;
    }

    if (!isValidDomain(newDomain.trim())) {
      setError("Please enter a valid domain (e.g., example.com)");
      return;
    }

    if (newDomain.trim() === currentDomain) {
      setError("New domain must be different from current domain");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/domain-change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDomain: newDomain.trim(),
          reason,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      const data = await response.json();

      // Reset form
      setNewDomain("");
      setReason("");
      setNotes("");

      // Show success toast
      toast.success("Domain change request submitted!", {
        description: `Request ID: ${data.requestId}. Our team will review it within ${data.estimatedProcessingTime}.`,
      });

      // Close modal
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit domain change request");
      toast.error("Error", {
        description: err.message || "Failed to submit request",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Domain Change</DialogTitle>
          <DialogDescription>
            Current domain: <span className="font-semibold text-foreground">{currentDomain}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Alert */}
          {error && (
            <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* New Domain */}
          <div className="space-y-2">
            <Label htmlFor="new-domain">New Domain *</Label>
            <Input
              id="new-domain"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              disabled={loading}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Enter the domain you'd like to migrate to (without https://)
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a reason...</option>
              <option value="brand_change">Brand/Business Change</option>
              <option value="better_domain">Better Domain Name</option>
              <option value="seo_optimization">SEO Optimization</option>
              <option value="consolidation">Domain Consolidation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information we should know about this change?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="bg-background min-h-[100px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Your domain will be migrated with zero downtime. Our team will contact you with next steps.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
