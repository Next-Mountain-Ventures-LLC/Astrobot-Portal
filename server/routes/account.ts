import { RequestHandler } from "express";
import { AccountProfile, Subscription, TeamMember, UserInvite, Permission } from "@shared/api";

// Mock account database
const mockAccounts: Record<string, AccountProfile & { subscription: Subscription; role: string }> = {
  "demo@astrobot.design": {
    id: "demo@astrobot.design",
    name: "Demo User",
    email: "demo@astrobot.design",
    company: "Tech Ventures",
    role: "admin",
    subscription: {
      id: "sub-001",
      plan: "Professional",
      status: "active",
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
};

// Mock team members
const mockTeamMembers: TeamMember[] = [
  {
    id: "user-001",
    email: "demo@astrobot.design",
    name: "Demo User",
    role: "admin",
    permissions: ["view_projects", "edit_projects", "submit_changes", "manage_team", "view_reports"],
    joinedAt: new Date().toISOString(),
    status: "active",
  },
  {
    id: "user-002",
    email: "john@company.com",
    name: "John Smith",
    role: "member",
    permissions: ["view_projects", "submit_changes"],
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    id: "user-003",
    email: "sarah@company.com",
    name: "Sarah Johnson",
    role: "viewer",
    permissions: ["view_projects"],
    joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
];

// Mock invites
const mockInvites: UserInvite[] = [
  {
    id: "invite-001",
    email: "pending@company.com",
    role: "member",
    permissions: ["view_projects", "submit_changes"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  },
];

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

export const handleGetTeamMembers: RequestHandler = (req, res) => {
  try {
    res.json(mockTeamMembers);
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleInviteUser: RequestHandler = (req, res) => {
  try {
    const { email, role, permissions } = req.body;

    // Validate input
    if (!email || !role) {
      res.status(400).json({ error: "Email and role required" });
      return;
    }

    // Check if already invited or member
    const existingMember = mockTeamMembers.find((m) => m.email === email);
    if (existingMember) {
      res.status(409).json({ error: "User is already a team member" });
      return;
    }

    const existingInvite = mockInvites.find((i) => i.email === email && i.status === "pending");
    if (existingInvite) {
      res.status(409).json({ error: "User already has a pending invite" });
      return;
    }

    // Create invite
    const invite: UserInvite = {
      id: `invite-${Date.now()}`,
      email,
      role,
      permissions: permissions || ["view_projects"],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    };

    mockInvites.push(invite);
    res.status(201).json(invite);
  } catch (error) {
    console.error("Invite user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetInvites: RequestHandler = (req, res) => {
  try {
    res.json(mockInvites);
  } catch (error) {
    console.error("Get invites error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleUpdatePermissions: RequestHandler = (req, res) => {
  try {
    const { userId, role, permissions } = req.body;

    const member = mockTeamMembers.find((m) => m.id === userId);
    if (!member) {
      res.status(404).json({ error: "Team member not found" });
      return;
    }

    // Update role and permissions
    if (role) member.role = role;
    if (permissions) member.permissions = permissions;

    res.json(member);
  } catch (error) {
    console.error("Update permissions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleRemoveTeamMember: RequestHandler = (req, res) => {
  try {
    const { userId } = req.body;

    const index = mockTeamMembers.findIndex((m) => m.id === userId);
    if (index === -1) {
      res.status(404).json({ error: "Team member not found" });
      return;
    }

    const removed = mockTeamMembers.splice(index, 1);
    res.json({ message: "Team member removed", member: removed[0] });
  } catch (error) {
    console.error("Remove team member error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
