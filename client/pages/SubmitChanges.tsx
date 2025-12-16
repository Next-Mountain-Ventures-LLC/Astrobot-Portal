import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubmitChanges() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    description: "",
    category: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Change request submitted successfully!");
        navigate("/dashboard");
      } else {
        alert("Failed to submit change request");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl">
        {/* Back Button */}
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Submit Changes</h1>
          <p className="text-muted-foreground mt-2">Tell us what you'd like to change or add to your website</p>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div>
              <Label htmlFor="projectId">Project</Label>
              <Select value={formData.projectId} onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, projectId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">TechStart Ventures</SelectItem>
                  <SelectItem value="2">Digital Design Co</SelectItem>
                  <SelectItem value="3">E-Commerce Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Change Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Update homepage hero section"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Content Update</SelectItem>
                  <SelectItem value="design">Design Change</SelectItem>
                  <SelectItem value="feature">New Feature</SelectItem>
                  <SelectItem value="bug">Bug Fix</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, priority: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the changes you'd like to make..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Change Request"}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
