"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leaveRequests } from "@/db/schema";
import { getCurrentUser } from "@workspace/supabase";
import { isUserAdmin } from "@/lib/user-db-utils";

export async function approveLeaveRequest(requestId: string, approvalNotes?: string) {
  try {
    // Get current user to verify admin role
    const { user } = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin using Drizzle ORM
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Update the leave request using Drizzle ORM
    const db = getDb();
    await db
      .update(leaveRequests)
      .set({
        status: "approved",
        approved_by_id: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes || null,
        updated_at: new Date().toISOString()
      })
      .where(eq(leaveRequests.id, requestId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error approving leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function rejectLeaveRequest(requestId: string, rejectionReason: string) {
  try {
    // Get current user to verify admin role
    const { user } = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin using Drizzle ORM
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Update the leave request using Drizzle ORM
    const db = getDb();
    await db
      .update(leaveRequests)
      .set({
        status: "rejected",
        approved_by_id: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .where(eq(leaveRequests.id, requestId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function cancelLeaveRequest(requestId: string, cancelReason: string) {
  try {
    // Get current user to verify admin role
    const { user } = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin using Drizzle ORM
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Update the leave request using Drizzle ORM
    const db = getDb();
    await db
      .update(leaveRequests)
      .set({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
        updated_at: new Date().toISOString()
      })
      .where(eq(leaveRequests.id, requestId));

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error canceling leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
} 