-- Fix RLS policy for leave_requests table
-- The current policy incorrectly checks auth.jwt() ->> 'role' but roles are stored in the users table

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Admins and managers can view and update all leave requests" ON leave_requests;

-- Create the correct policy that checks the role from the users table
CREATE POLICY "Admins and managers can view and update all leave requests"
  ON leave_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );