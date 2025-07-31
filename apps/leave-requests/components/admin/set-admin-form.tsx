"use client";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";
import { createBrowserClient } from "@workspace/supabase";

export default function SetAdminForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      
      // Find user by email
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", email)
        .single();

      if (userError || !user) {
        toast.error("User not found");
        return;
      }

      // Update user role to admin
      const { error: updateError } = await supabase
        .from("users")
        .update({ role: "admin" })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating user role:", updateError);
        toast.error("Failed to set admin role");
        return;
      }

      toast.success(`Successfully set ${user.full_name} (${user.email}) as admin`);
      setEmail("");
    } catch (error) {
      console.error("Error setting admin role:", error);
      toast.error("Failed to set admin role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">User Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email"
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Setting..." : "Set as Admin"}
      </Button>
    </form>
  );
} 