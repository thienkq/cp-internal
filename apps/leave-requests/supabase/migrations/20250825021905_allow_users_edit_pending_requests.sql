-- Allow users to update their own pending leave requests
-- This policy allows users to edit/cancel only their own pending requests

CREATE POLICY "Users can update their own pending leave requests"
  ON leave_requests
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status IN ('pending', 'canceled')
  );