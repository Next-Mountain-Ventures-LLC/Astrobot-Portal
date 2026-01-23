import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { ArrowLeft, CheckCircle2, Clock, FileText, ExternalLink } from "lucide-react";
import { DomainSection } from "@/components/DomainSection";
import { DomainChangeModal } from "@/components/DomainChangeModal";
import { SSLStatus } from "@/components/SSLStatus";
import { HostingPerformance } from "@/components/HostingPerformance";
import { EditableSettings } from "@/components/EditableSettings";
import { SupportContact } from "@/components/SupportContact";
import { ProjectDetail as ProjectDetailType } from "@shared/api";

// Generate screenshot URL with fallback services
const getScreenshotUrl = (url: string): string => {
  try {
    // Use thum.io for reliable website screenshots
    // thum.io is a stable, widely-used screenshot service
    return `https://image.thum.io/get/width/800/height/400/${encodeURIComponent(url)}`;
  } catch {
    return "";
  }
};

// Generate professional placeholder images based on project name
const getPlaceholderImage = (projectName: string): string => {
  const colors = [
    "0066ff-00d4ff",
    "7c3aed-ec4899",
    "059669-14b8a6",
    "ea580c-f97316",
    "4f46e5-3b82f6",
  ];

  const colorIndex = projectName.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  const encoded = encodeURIComponent(projectName);

  return `https://placeholder.com/800x400/${bgColor}?text=${encoded}&fontsize=28&font=Raleway`;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainChangeModalOpen, setDomainChangeModalOpen] = useState(false);

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const fetchProjectDetail = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      setProject({
        id: id || "1",
        name: "Website Project",
        status: "development",
        progress: 65,
        description: "A modern, fast website built with Astro framework",
        startDate: "2024-01-01",
        launchDate: "2024-02-15",
        domain: "example.com",
        sslStatus: "active",
        uptime: 99.9,
        pageLoadTime: 1200,
        hostingRegion: "US-East-1",
        userId: "550e8400-e29b-41d4-a716-446655440000",
        websiteUrl: "https://example.com",
        timeline: [
          { phase: "Design Phase", completed: true, date: "2024-01-15" },
          { phase: "Development", completed: true, date: "2024-02-01" },
          { phase: "Review & Testing", completed: false },
          { phase: "Launch", completed: false },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading website details...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Website not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Website Hero Section */}
        <div className="space-y-4">
          {project.websiteUrl && (
            <Card className="overflow-hidden border-border">
              <div className="h-64 bg-gradient-to-br from-secondary to-background">
                <img
                  src={getScreenshotUrl(project.websiteUrl)}
                  alt={`${project.name} preview`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderImage(project.name);
                  }}
                />
              </div>
            </Card>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-2">{project.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary text-sm px-3 py-1">
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
              {project.websiteUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Live Site
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Domain, SSL, Settings */}
          <div className="lg:col-span-1 space-y-6">
            <DomainSection
              domain={project.domain}
              onRequestChange={() => setDomainChangeModalOpen(true)}
            />
            <SSLStatus
              status={project.sslStatus}
            />
            <EditableSettings
              projectName={project.name}
              projectId={project.id}
            />
          </div>

          {/* Right Column: Performance, Support, Progress */}
          <div className="lg:col-span-2 space-y-6">
            <HostingPerformance
              uptime={project.uptime}
              pageLoadTime={project.pageLoadTime}
              hostingRegion={project.hostingRegion}
            />
            <SupportContact projectId={project.id} />

            {/* Progress Section */}
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Project Progress</h2>
                  <span className="text-3xl font-bold text-primary">{project.progress}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Timeline Section */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold mb-6">Project Timeline</h2>
          <div className="space-y-4">
            {project.timeline.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  )}
                  {index < project.timeline.length - 1 && (
                    <div className="w-0.5 h-12 bg-border my-2" />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`font-medium ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.phase}
                  </p>
                  {item.date && (
                    <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Actions */}
        <div className="flex gap-4">
          <Button
            className="flex-1 bg-accent hover:bg-accent/90"
            onClick={() => navigate("/submit-changes")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Submit Changes
          </Button>
          <Button variant="outline" className="flex-1">
            Download Files
          </Button>
        </div>

        {/* Domain Change Modal */}
        <DomainChangeModal
          open={domainChangeModalOpen}
          onOpenChange={setDomainChangeModalOpen}
          projectId={project.id}
          currentDomain={project.domain}
        />
      </div>
    </Layout>
  );
}
