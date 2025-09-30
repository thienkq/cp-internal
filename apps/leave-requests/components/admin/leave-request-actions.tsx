'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import {
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from '@/app/admin/leave-requests/actions';
import {
  approveLeaveRequest as managerApproveLeaveRequest,
  rejectLeaveRequest as managerRejectLeaveRequest,
  cancelLeaveRequest as managerCancelLeaveRequest,
} from '@/app/manager/actions';
import { LeaveRequest } from '@/types';
import { toast } from 'sonner';

interface LeaveRequestActionsProps {
  request: LeaveRequest;
  onActionComplete: () => void;
  isManagerView?: boolean;
}

export function LeaveRequestActions({
  request,
  onActionComplete,
  isManagerView = false,
}: LeaveRequestActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<
    'approve' | 'reject' | 'cancel' | null
  >(null);
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAction = async () => {
    if (!notes.trim() && actionType !== 'approve') {
      toast.error('Please provide a reason');
      return;
    }

    setIsLoading(true);
    try {
      let result;

      switch (actionType) {
        case 'approve':
          result = isManagerView
            ? await managerApproveLeaveRequest(
                request.id,
                notes.trim() || undefined
              )
            : await approveLeaveRequest(request.id, notes.trim() || undefined);
          break;
        case 'reject':
          result = isManagerView
            ? await managerRejectLeaveRequest(request.id, notes)
            : await rejectLeaveRequest(request.id, notes);
          break;
        case 'cancel':
          result = isManagerView
            ? await managerCancelLeaveRequest(request.id, notes)
            : await cancelLeaveRequest(request.id, notes);
          break;
        default:
          return;
      }

      if (result.success) {
        toast.success(`Leave request ${actionType}d successfully`);
        setIsDialogOpen(false);
        setNotes('');
        setActionType(null);
        onActionComplete();
      } else {
        toast.error(result.error || `Failed to ${actionType} leave request`);
      }
    } catch (error) {
      toast.error(`Error ${actionType}ing leave request`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openActionDialog = (type: 'approve' | 'reject' | 'cancel') => {
    setActionType(type);
    setNotes('');
    setIsDialogOpen(true);
  };

  const getActionButton = (type: 'approve' | 'reject' | 'cancel') => {
    const buttonProps = {
      size: 'sm' as const,
      onClick: () => openActionDialog(type),
      disabled: isLoading,
    };

    switch (type) {
      case 'approve':
        return (
          <Button
            {...buttonProps}
            variant='default'
            className='bg-green-600 hover:bg-green-700 cursor-pointer'
          >
            Approve
          </Button>
        );
      case 'reject':
        return (
          <Button {...buttonProps} variant='destructive' className='cursor-pointer'>
            Reject
          </Button>
        );
      case 'cancel':
        return (
          <Button {...buttonProps} variant='outline' className='cursor-pointer'>
            Cancel
          </Button>
        );
    }
  };

  const getDialogTitle = () => {
    switch (actionType) {
      case 'approve':
        return 'Approve Leave Request';
      case 'reject':
        return 'Reject Leave Request';
      case 'cancel':
        return 'Cancel Leave Request';
      default:
        return '';
    }
  };

  const getDialogDescription = () => {
    switch (actionType) {
      case 'approve':
        return 'Are you sure you want to approve this leave request? You can add optional approval notes below.';
      case 'reject':
        return 'Please provide a reason for rejecting this leave request.';
      case 'cancel':
        return 'Please provide a reason for canceling this leave request.';
      default:
        return '';
    }
  };

  const getNotesLabel = () => {
    switch (actionType) {
      case 'approve':
        return 'Approval Notes (Optional)';
      case 'reject':
        return 'Rejection Reason *';
      case 'cancel':
        return 'Cancellation Reason *';
      default:
        return '';
    }
  };

  const getActionButtonText = () => {
    if (isLoading) return 'Processing...';

    switch (actionType) {
      case 'approve':
        return 'Approve';
      case 'reject':
        return 'Reject';
      case 'cancel':
        return 'Confirm Cancellation';
      default:
        return '';
    }
  };

  return (
    <div className='flex items-center gap-2 flex-wrap justify-center'>
      {getActionButton('approve')}
      {getActionButton('reject')}
      {getActionButton('cancel')}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='notes'>{getNotesLabel()}</Label>
              <Textarea
                id='notes'
                placeholder={
                  actionType === 'approve'
                    ? 'Optional approval notes...'
                    : 'Please provide a reason...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              className='cursor-pointer'
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button
              className='cursor-pointer'
              onClick={handleAction}
              disabled={
                isLoading || (!notes.trim() && actionType !== 'approve')
              }
              variant={
                actionType === 'approve'
                  ? 'default'
                  : actionType === 'reject'
                    ? 'destructive'
                    : 'outline'
              }
            >
              {getActionButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
