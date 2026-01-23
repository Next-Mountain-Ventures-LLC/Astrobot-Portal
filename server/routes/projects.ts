import { RequestHandler } from "express";
import { Project, ProjectDetail, DomainChangeRequest, SupportTicket } from "@shared/api";
import { getSupabase } from "../supabase";

// Mock timeline for now - could be extended to database
const mockTimelines: Record<string, ProjectDetail["timeline"]> = {
  "1": [
    { phase: "Design Phase", completed: true, date: "2024-01-15" },
    { phase: "Development", completed: true, date: "2024-02-01" },
    { phase: "Review & Testing", completed: false },
    { phase: "Launch", completed: false },
  ],
};

export const handleGetProjects: RequestHandler = async (req, res) => {
  try {
    // Get user from auth header (simplified for demo)
    const userId = "550e8400-e29b-41d4-a716-446655440000";

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      // Return mock projects instead of error
      res.json([
        { id: "1", name: "TechStart Ventures", status: "development", progress: 65, description: "A modern marketing website for a tech startup", startDate: "2024-01-01", launchDate: "2024-02-15", userId, websiteUrl: "https://www.stripe.com" },
        { id: "2", name: "Digital Design Co", status: "design", progress: 30, description: "Portfolio website for a design agency", startDate: "2024-01-10", userId, websiteUrl: "https://www.dribbble.com" },
        { id: "3", name: "E-Commerce Plus", status: "review", progress: 90, description: "Full e-commerce platform for online retail", startDate: "2023-11-01", launchDate: "2024-01-20", userId, websiteUrl: "https://www.shopify.com" },
      ]);
      return;
    }

    // Transform database format to API format
    const projects: Project[] = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      description: p.description,
      startDate: p.start_date,
      launchDate: p.launch_date,
      userId: p.user_id,
      websiteUrl: p.website_url,
    }));

    res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    // Return mock projects on error
    res.json([
      { id: "1", name: "TechStart Ventures", status: "development", progress: 65, description: "A modern marketing website for a tech startup", startDate: "2024-01-01", launchDate: "2024-02-15", userId: "550e8400-e29b-41d4-a716-446655440000", websiteUrl: "https://www.stripe.com" },
      { id: "2", name: "Digital Design Co", status: "design", progress: 30, description: "Portfolio website for a design agency", startDate: "2024-01-10", userId: "550e8400-e29b-41d4-a716-446655440000", websiteUrl: "https://www.dribbble.com" },
      { id: "3", name: "E-Commerce Plus", status: "review", progress: 90, description: "Full e-commerce platform for online retail", startDate: "2023-11-01", launchDate: "2024-01-20", userId: "550e8400-e29b-41d4-a716-446655440000", websiteUrl: "https://www.shopify.com" },
    ]);
  }
};

export const handleGetProjectDetail: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Mock domain data - in production, this would come from hosting provider
    const mockDomainData: Record<string, { domain: string; sslStatus: "active" | "pending" | "expired" | "none"; uptime: number; pageLoadTime: number; hostingRegion: string }> = {
      "1": { domain: "astrobot.design", sslStatus: "active", uptime: 99.8, pageLoadTime: 1240, hostingRegion: "US-East-1" },
      "2": { domain: "searchserpa.com", sslStatus: "pending", uptime: 99.5, pageLoadTime: 1850, hostingRegion: "US-West-1" },
      "3": { domain: "climb.coach", sslStatus: "active", uptime: 99.9, pageLoadTime: 950, hostingRegion: "EU-West-1" },
    };

    const domainData = mockDomainData[id] || { domain: "example.com", sslStatus: "active" as const, uptime: 99.9, pageLoadTime: 1200, hostingRegion: "US-East-1" };

    const project: ProjectDetail = {
      id: data.id,
      name: data.name,
      status: data.status,
      progress: data.progress,
      description: data.description,
      startDate: data.start_date,
      launchDate: data.launch_date,
      userId: data.user_id,
      websiteUrl: data.website_url,
      domain: domainData.domain,
      sslStatus: domainData.sslStatus,
      uptime: domainData.uptime,
      pageLoadTime: domainData.pageLoadTime,
      hostingRegion: domainData.hostingRegion,
      timeline: mockTimelines[id] || [],
    };

    res.json(project);
  } catch (error) {
    console.error("Get project detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
