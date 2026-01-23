import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditableSettingsProps {
  projectName: string;
  projectId: string;
  onUpdate?: (newName: string) => void;
}

export function EditableSettings({
  projectName,
  projectId,
  onUpdate,
}: EditableSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (editValue.trim() === projectName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      // In a real app, this would call an API endpoint to update the project name
      // For now, we'll just simulate the save
      await new Promise((resolve) => setTimeout(resolve, 500));

      setEditValue(editValue.trim());
      setIsEditing(false);
      onUpdate?.(editValue.trim());

      toast.success("Website name updated successfully");
    } catch (error) {
      toast.error("Failed to update website name");
      setEditValue(projectName);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(projectName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Settings</h3>
        </div>

        {/* Website Display Name */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Website Display Name
            </Label>

            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  disabled={isSaving}
                  placeholder="Enter website name"
                  className="bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-accent hover:bg-accent/90"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-background border border-border rounded-lg flex items-center justify-between group hover:border-primary transition-colors cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <p className="text-foreground font-medium">{editValue}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            This name is used in your admin panel and customer communications.
          </p>
        </div>
      </div>
    </Card>
  );
}
