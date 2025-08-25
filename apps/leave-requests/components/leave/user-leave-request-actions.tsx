"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cancelLeaveRequest } from "@/app/dashboard/leave/actions";
import type { LeaveRequest } from "@/types";

interface UserLeaveRequestActionsProps {
  request: LeaveRequest;
  onActionComplete: () => void;
}

export function UserLeaveRequestActions({ request, onActionComplete }: UserLeaveRequestActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for canceling");
      return;
    }

    setIsLoading(true);
    try {
      const result = await cancelLeaveRequest(request.id, cancelReason);
      
      if (result.success) {
        toast.success("Leave request canceled successfully");
        setIsCancelDialogOpen(false);
        setCancelReason("");
        onActionComplete();
      } else {
        toast.error(result.error || "Failed to cancel leave request");
      }
    } catch (error) {
      toast.error("Error canceling leave request");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show actions for pending requests
  if (request.status !== 'pending') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8 px-2"
      >
        <Link href={`/dashboard/leave/${request.id}/edit`}>
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Link>
      </Button>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
              Please provide a reason for the cancellation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for cancellation</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please explain why you're canceling this leave request..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setCancelReason("");
              }}
              disabled={isLoading}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading || !cancelReason.trim()}
            >
              {isLoading ? "Canceling..." : "Cancel Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}