import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Zap, MapPin } from "lucide-react";

interface HostingPerformanceProps {
  uptime?: number; // Percentage (0-100)
  pageLoadTime?: number; // Milliseconds
  hostingRegion?: string;
  onRefresh?: () => void;
}

export function HostingPerformance({
  uptime = 99.9,
  pageLoadTime = 1240,
  hostingRegion = "US-East-1",
  onRefresh,
}: HostingPerformanceProps) {
  const getLoadTimeColor = (time: number) => {
    if (time < 1000) return { bg: "bg-green-500/20", text: "text-green-500", label: "Fast" };
    if (time < 2000) return { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "Good" };
    return { bg: "bg-orange-500/20", text: "text-orange-500", label: "Slow" };
  };

  const loadTimeColor = getLoadTimeColor(pageLoadTime);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Hosting & Performance</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Uptime */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Uptime</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-green-500">{uptime}%</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* Page Load Time */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Page Load Time</p>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-2xl font-bold ${loadTimeColor.text}`}>
                  {pageLoadTime}ms
                </p>
                <p className={`text-xs mt-1 ${loadTimeColor.text}`}>
                  {loadTimeColor.label}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full ${loadTimeColor.bg} flex items-center justify-center`}>
                <Zap className={`w-6 h-6 ${loadTimeColor.text}`} />
              </div>
            </div>
          </div>

          {/* Hosting Region */}
          <div className="p-4 bg-background border border-border rounded-lg col-span-2">
            <p className="text-xs text-muted-foreground mb-2">Hosting Region</p>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">{hostingRegion}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your site is hosted in the {hostingRegion} region for optimal performance.
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
          <p className="text-xs text-muted-foreground">
            💡 Performance metrics are updated every 5 minutes. Contact support if you notice any issues.
          </p>
        </div>
      </div>
    </Card>
  );
}
