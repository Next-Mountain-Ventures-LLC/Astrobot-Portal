import { RequestHandler } from "express";
import { Project, ProjectDetail } from "@shared/api";

// Mock project database
const mockProjects: Project[] = [
  {
    id: "1",
    name: "TechStart Ventures",
    status: "development",
    progress: 65,
    description: "A modern marketing website for a tech startup",
    startDate: "2024-01-01",
    launchDate: "2024-02-15",
    userId: "demo@astrobot.design",
    websiteUrl: "https://www.stripe.com",
  },
  {
    id: "2",
    name: "Digital Design Co",
    status: "design",
    progress: 30,
    description: "Portfolio website for a design agency",
    startDate: "2024-01-10",
    userId: "demo@astrobot.design",
    websiteUrl: "https://www.dribbble.com",
  },
  {
    id: "3",
    name: "E-Commerce Plus",
    status: "review",
    progress: 90,
    description: "Full e-commerce platform for online retail",
    startDate: "2023-11-01",
    launchDate: "2024-01-20",
    userId: "demo@astrobot.design",
    websiteUrl: "https://www.shopify.com",
  },
];

const mockTimelines: Record<string, ProjectDetail["timeline"]> = {
  "1": [
    { phase: "Design Phase", completed: true, date: "2024-01-15" },
    { phase: "Development", completed: true, date: "2024-02-01" },
    { phase: "Review & Testing", completed: false },
    { phase: "Launch", completed: false },
  ],
  "2": [
    { phase: "Discovery & Planning", completed: true, date: "2024-01-10" },
    { phase: "Design Phase", completed: false },
    { phase: "Development", completed: false },
    { phase: "Launch", completed: false },
  ],
  "3": [
    { phase: "Design Phase", completed: true, date: "2023-11-15" },
    { phase: "Development", completed: true, date: "2023-12-15" },
    { phase: "Review & Testing", completed: true, date: "2024-01-10" },
    { phase: "Launch", completed: false },
  ],
};

export const handleGetProjects: RequestHandler = (req, res) => {
  try {
    // In production, filter by user ID from auth token
    res.json(mockProjects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetProjectDetail: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const project = mockProjects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const timeline = mockTimelines[id] || [];

    const detail: ProjectDetail = {
      ...project,
      timeline,
    };

    res.json(detail);
  } catch (error) {
    console.error("Get project detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
