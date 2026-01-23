import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface DomainSectionProps {
  domain?: string;
  onRequestChange: () => void;
}

export function DomainSection({ domain = "example.com", onRequestChange }: DomainSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Domain</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-500">Active</span>
          </div>
        </div>

        {/* Domain Display */}
        <div className="space-y-3">
          <div className="p-4 bg-background border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Current Domain</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-foreground break-all">{domain}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyDomain}
                className="ml-2"
                title="Copy domain"
              >
                <Copy className={`w-4 h-4 ${copied ? "text-green-500" : "text-muted-foreground"}`} />
              </Button>
            </div>
            {copied && <p className="text-xs text-green-500 mt-2">Copied!</p>}
          </div>
        </div>

        {/* Quick Link */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1"
          >
            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
              Visit Site
            </a>
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-accent/90"
            onClick={onRequestChange}
          >
            Request Change
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          Need a different domain? Our team will help you migrate at no extra cost.
        </p>
      </div>
    </Card>
  );
}
