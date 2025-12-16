import { RequestHandler } from "express";
import { ChangeRequest } from "@shared/api";

// Mock change requests database
const mockChangeRequests: ChangeRequest[] = [];

export const handleSubmitChange: RequestHandler = (req, res) => {
  try {
    const { projectId, title, description, category, priority } = req.body;

    // Validate input
    if (!projectId || !title || !description || !category) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const changeRequest: ChangeRequest = {
      id: Date.now().toString(),
      projectId,
      title,
      description,
      category,
      priority: priority || "medium",
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockChangeRequests.push(changeRequest);

    res.status(201).json(changeRequest);
  } catch (error) {
    console.error("Submit change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetChanges: RequestHandler = (req, res) => {
  try {
    // In production, filter by user ID from auth token
    res.json(mockChangeRequests);
  } catch (error) {
    console.error("Get changes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
