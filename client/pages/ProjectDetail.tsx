import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { ArrowLeft, CheckCircle2, Clock, FileText } from "lucide-react";

// Generate screenshot URL with fallback services
const getScreenshotUrl = (url: string): string => {
  try {
    return `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=800&height=400`;
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

interface Project {
  id: string;
  name: string;
  status: "design" | "development" | "review" | "launched";
  progress: number;
  description: string;
  startDate: string;
  launchDate?: string;
  websiteUrl?: string;
  timeline: Array<{
    phase: string;
    completed: boolean;
    date?: string;
  }>;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Website Thumbnail */}
        {project.websiteUrl && (
          <Card className="overflow-hidden">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground mt-2">{project.description}</p>
          </div>
          <Badge className="w-fit bg-primary/20 text-primary text-lg px-4 py-2">
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>

        {/* Progress */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Overall Progress</h2>
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

        {/* Timeline */}
        <Card className="p-6">
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

        {/* Actions */}
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
      </div>
    </Layout>
  );
}
