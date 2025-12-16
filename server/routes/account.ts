import { RequestHandler } from "express";
import { AccountProfile, Subscription } from "@shared/api";

// Mock account database
const mockAccounts: Record<string, AccountProfile & { subscription: Subscription }> = {
  "demo@astrobot.design": {
    id: "demo@astrobot.design",
    name: "Demo User",
    email: "demo@astrobot.design",
    company: "Tech Ventures",
    subscription: {
      id: "sub-001",
      plan: "Professional",
      status: "active",
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

export const handleGetProfile: RequestHandler = (req, res) => {
  try {
    // In production, get user ID from auth token
    const userId = "demo@astrobot.design";

    const account = mockAccounts[userId];
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    const { subscription, ...profile } = account;
    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdateProfile: RequestHandler = (req, res) => {
  try {
    const userId = "demo@astrobot.design";
    const { name, email, company } = req.body;

    const account = mockAccounts[userId];
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    // Update profile
    if (name) account.name = name;
    if (email) account.email = email;
    if (company) account.company = company;

    const { subscription, ...profile } = account;
    res.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetSubscription: RequestHandler = (req, res) => {
  try {
    const userId = "demo@astrobot.design";

    const account = mockAccounts[userId];
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    res.json(account.subscription);
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
