import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SupportContactProps {
  projectId: string;
}

export function SupportContact({ projectId }: SupportContactProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<"technical" | "billing" | "domain" | "general">("general");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/support-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit ticket");
      }

      const data = await response.json();

      // Reset form
      setSubject("");
      setMessage("");
      setCategory("general");

      // Show success toast
      toast.success("Support ticket created!", {
        description: `Ticket ID: ${data.ticketId}. We'll respond within ${data.estimatedResponseTime}.`,
      });

      // Close modal
      setOpen(false);
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "Failed to submit support ticket",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 bg-card border-border">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Support</h3>
          </div>

          {/* Support Info */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Need help with your website? Our support team is here to assist you.
            </p>

            <div className="space-y-2">
              {/* Email Support */}
              <div className="p-3 bg-background border border-border rounded-lg flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Email Support</p>
                  <a
                    href="mailto:support@astrobot.design"
                    className="text-sm text-accent hover:text-accent/90 transition-colors"
                  >
                    support@astrobot.design
                  </a>
                </div>
              </div>

              {/* Contact Form Button */}
              <Button
                onClick={() => setOpen(true)}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Create Support Ticket
              </Button>
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            ⏱️ We typically respond to support tickets within 2-4 hours during business hours.
          </p>
        </div>
      </Card>

      {/* Support Ticket Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Tell us how we can help you with your website
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                disabled={loading}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="general">General Support</option>
                <option value="technical">Technical Issue</option>
                <option value="domain">Domain Related</option>
                <option value="billing">Billing Question</option>
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                className="bg-background"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Please provide detailed information about your issue..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                className="bg-background min-h-[120px] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
                {loading ? "Submitting..." : "Submit Ticket"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              We'll send you updates on your ticket via email
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
