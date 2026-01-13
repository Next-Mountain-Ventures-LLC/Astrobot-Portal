import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { ArrowRight, Rocket } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: "design" | "development" | "review" | "launched";
  progress: number;
  launchDate?: string;
  websiteUrl?: string;
}

// Generate screenshot URL with fallback services
const getScreenshotUrl = (url: string): string => {
  try {
    // Try multiple screenshot services with fallbacks
    // Using screenshotapi.net which provides clean website mockups
    return `https://shot.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=400&height=300`;
  } catch {
    return "";
  }
};

// Generate professional placeholder images based on project name
const getPlaceholderImage = (projectName: string): string => {
  const colors = [
    "gradient-to-br from-blue-600 to-cyan-400",
    "gradient-to-br from-purple-600 to-pink-400",
    "gradient-to-br from-emerald-600 to-teal-400",
    "gradient-to-br from-orange-600 to-red-400",
    "gradient-to-br from-indigo-600 to-blue-400",
  ];

  const colorIndex = projectName.charCodeAt(0) % colors.length;
  const bgGradient = colors[colorIndex];
  const encoded = encodeURIComponent(projectName);

  // Use a placeholder service that generates nice website mockup style images
  return `https://placeholder.com/400x300/${bgGradient.split(" ")[2]}/${bgGradient.split(" ")[4]}?text=${encoded}&fontsize=20&font=Raleway`;
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data && typeof data === "object" && data.data && Array.isArray(data.data)) {
        // Handle wrapped response like { data: [...], error: null }
        setProjects(data.data);
      } else {
        console.error("Invalid projects data, using fallback:", data);
        // Use fallback mock data
        setProjects([
          { id: "1", name: "TechStart Ventures", status: "development", progress: 65, launchDate: "2024-02-15", websiteUrl: "https://www.stripe.com" },
          { id: "2", name: "Digital Design Co", status: "design", progress: 30, websiteUrl: "https://www.dribbble.com" },
          { id: "3", name: "E-Commerce Plus", status: "review", progress: 90, launchDate: "2024-01-20", websiteUrl: "https://www.shopify.com" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([
        { id: "1", name: "TechStart Ventures", status: "development", progress: 65, launchDate: "2024-02-15", websiteUrl: "https://www.stripe.com" },
        { id: "2", name: "Digital Design Co", status: "design", progress: 30, websiteUrl: "https://www.dribbble.com" },
        { id: "3", name: "E-Commerce Plus", status: "review", progress: 90, launchDate: "2024-01-20", websiteUrl: "https://www.shopify.com" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "design":
        return "bg-primary/20 text-primary";
      case "development":
        return "bg-accent/20 text-accent";
      case "review":
        return "bg-yellow-500/20 text-yellow-400";
      case "launched":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-muted";
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Your Websites</h1>
          <p className="text-muted-foreground mt-2">Manage your website builds and track progress</p>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No websites yet</p>
            <p className="text-sm text-muted-foreground">Contact us to get started with your website build</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer overflow-hidden flex flex-col">
                  {/* Website Thumbnail */}
                  {project.websiteUrl && (
                    <div className="relative h-40 bg-gradient-to-br from-secondary to-background overflow-hidden border-b border-border">
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
                  )}

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold flex-1">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground font-medium">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {project.launchDate && (
                      <p className="text-xs text-muted-foreground">
                        Launch: {new Date(project.launchDate).toLocaleDateString()}
                      </p>
                    )}

                    <div className="space-y-2 mt-auto">
                      <Link to="/submit-changes" className="block">
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Rocket className="w-4 h-4 mr-2" />
                          Submit Changes
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full group border-primary/30 hover:border-primary"
                        asChild
                      >
                        <span>
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
