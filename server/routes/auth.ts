import { RequestHandler } from "express";
import { AuthRequest, AuthResponse } from "@shared/api";

// Mock user database - in production, use a real database
const mockUsers: Record<string, { email: string; password: string; name: string }> = {
  "demo@astrobot.design": {
    email: "demo@astrobot.design",
    password: "password",
    name: "Demo User",
  },
};

export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { email, password } = req.body as AuthRequest;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Check credentials
    const user = mockUsers[email];
    if (!user || user.password !== password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Create mock token
    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

    const response: AuthResponse = {
      id: email,
      email: user.email,
      name: user.name,
      token,
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleSignup: RequestHandler = (req, res) => {
  try {
    const { email, password, name } = req.body as AuthRequest & { name: string };

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name required" });
      return;
    }

    // Check if user exists
    if (mockUsers[email]) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    // Create new user
    mockUsers[email] = { email, password, name };

    // Create mock token
    const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

    const response: AuthResponse = {
      id: email,
      email,
      name,
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleLogout: RequestHandler = (req, res) => {
  // In a real app, you'd invalidate the token here
  res.json({ message: "Logged out successfully" });
};
