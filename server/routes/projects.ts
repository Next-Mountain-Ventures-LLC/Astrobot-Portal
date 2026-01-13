import { RequestHandler } from "express";
import { Project, ProjectDetail } from "@shared/api";
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
      res.status(400).json({ error: error.message });
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
    res.status(500).json({ error: "Internal server error" });
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
      timeline: mockTimelines[id] || [],
    };

    res.json(project);
  } catch (error) {
    console.error("Get project detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
