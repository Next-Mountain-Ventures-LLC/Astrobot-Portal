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
}

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
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([
        { id: "1", name: "TechStart Ventures", status: "development", progress: 65, launchDate: "2024-02-15" },
        { id: "2", name: "Digital Design Co", status: "design", progress: 30 },
        { id: "3", name: "E-Commerce Plus", status: "review", progress: 90, launchDate: "2024-01-20" },
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Your Projects</h1>
            <p className="text-muted-foreground mt-2">Manage your website builds and track progress</p>
          </div>
          <Link to="/submit-changes">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Rocket className="w-4 h-4 mr-2" />
              Submit Changes
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <p className="text-sm text-muted-foreground">Contact us to get started with your website build</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer overflow-hidden flex flex-col">
                  {/* Website Thumbnail */}
                  {project.websiteUrl && (
                    <div className="relative h-40 bg-secondary overflow-hidden border-b border-border">
                      <img
                        src={`https://microlink.io/?url=${encodeURIComponent(project.websiteUrl)}&screenshot=true&embed=screenshot.url`}
                        alt={`${project.name} preview`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/400x240?text=${encodeURIComponent(project.name)}`;
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

                    <Button
                      variant="outline"
                      className="w-full group border-primary/30 hover:border-primary mt-auto"
                      asChild
                    >
                      <span>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
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
