import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { User, CreditCard, LogOut, Users, Mail, Trash2, Shield } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  permissions: string[];
  status: "active" | "invited" | "pending";
}

interface UserInvite {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "declined";
}

export default function AccountSettings() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    company: "Tech Ventures",
  });
  const [isAdmin, setIsAdmin] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member" as "admin" | "member" | "viewer",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/team/members"),
        fetch("/api/team/invites"),
      ]);

      if (membersRes.ok) {
        const members = await membersRes.json();
        setTeamMembers(members);
      }
      if (invitesRes.ok) {
        const inviteList = await invitesRes.json();
        setInvites(inviteList);
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
      setTeamMembers([
        {
          id: "user-001",
          email: "john@example.com",
          name: "John Doe",
          role: "admin",
          permissions: ["view_projects", "edit_projects", "submit_changes", "manage_team", "view_reports"],
          status: "active",
        },
        {
          id: "user-002",
          email: "jane@company.com",
          name: "Jane Smith",
          role: "member",
          permissions: ["view_projects", "submit_changes"],
          status: "active",
        },
      ]);
      setInvites([
        {
          id: "invite-001",
          email: "pending@company.com",
          role: "member",
          status: "pending",
        },
      ]);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          permissions: getDefaultPermissions(inviteForm.role),
        }),
      });

      if (response.ok) {
        const newInvite = await response.json();
        setInvites([...invites, newInvite]);
        setInviteForm({ email: "", role: "member" });
        alert("Invite sent successfully!");
      } else {
        alert("Failed to send invite");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const response = await fetch(`/api/team/members/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setTeamMembers(teamMembers.filter((m) => m.id !== userId));
        alert("Team member removed!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to remove member");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case "admin":
        return ["view_projects", "edit_projects", "submit_changes", "manage_team", "view_reports"];
      case "member":
        return ["view_projects", "submit_changes"];
      case "viewer":
        return ["view_projects"];
      default:
        return [];
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-accent/20 text-accent";
      case "member":
        return "bg-primary/20 text-primary";
      case "viewer":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted";
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-4xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your profile and account preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={profile.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                value={profile.company}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Card>

        {/* Subscription */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-semibold">Subscription</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg font-semibold">Professional</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Renewal Date</p>
              <p className="text-lg font-semibold">February 15, 2025</p>
            </div>
            <Button variant="outline">Manage Subscription</Button>
          </div>
        </Card>

        {/* Admin Section - Team Management */}
        {isAdmin && (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Team Management</h2>
                <Badge className="bg-accent/20 text-accent ml-auto">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              </div>

              {/* Invite User Form */}
              <form onSubmit={handleInviteUser} className="space-y-4 mb-8 pb-8 border-b border-border">
                <h3 className="font-semibold text-lg">Invite Team Member</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="newmember@company.com"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="invite-role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          role: value as "admin" | "member" | "viewer",
                        }))
                      }
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </form>

              {/* Team Members */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Team Members ({teamMembers.length})</h3>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {member.permissions.length} permission
                            {member.permissions.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                      {member.id !== "user-001" && (
                        <Button
                          onClick={() => handleRemoveMember(member.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Pending Invites */}
            {invites.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
                <div className="space-y-3">
                  {invites.filter((i) => i.status === "pending").map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <Badge className={getRoleBadgeColor(invite.role)}>
                          {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-yellow-600">
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Logout */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <LogOut className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-semibold">Session</h2>
          </div>
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            Logout
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
