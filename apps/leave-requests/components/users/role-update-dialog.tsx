"use client";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";
// TODO: Replace Supabase calls with API routes
import { roleOptions } from "./user-constants";
import type { User } from "@/types";

interface RoleUpdateDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleUpdateDialog({ user, isOpen, onClose, onSuccess }: RoleUpdateDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    if (selectedRole === user.role) {
      toast.error("No changes to save");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Create API route for updating user roles
      toast.error("This functionality needs to be implemented with an API route");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user.full_name} ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Current role:</strong> {roleOptions.find(r => r.value === user.role)?.label}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedRole === user.role}
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}