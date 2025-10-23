"use server";

import { getUser } from "@/lib/auth-server-utils";
import { getDb } from "@/db";
import { users, leaveRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function approveLeaveRequest(requestId: string, approvalNotes?: string) {
  try {
    const db = getDb();

    // Get current user
    const user = await getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or manager
    const userData = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData.length || !["admin", "manager"].includes(userData[0]?.role || '')) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    // If user is a manager (not admin), verify they are the assigned manager for this request
    if (userData[0]?.role === "manager") {
      const requestData = await db
        .select({ current_manager_id: leaveRequests.current_manager_id })
        .from(leaveRequests)
        .where(eq(leaveRequests.id, requestId))
        .limit(1);

      if (!requestData.length) {
        throw new Error("Leave request not found");
      }

      if (requestData[0]?.current_manager_id !== user.id) {
        throw new Error("Unauthorized: You can only approve requests for your team members");
      }
    }

    // Update the leave request
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

    // Revalidate both admin and manager paths
    revalidatePath("/admin");
    revalidatePath("/manager");
    return { success: true };
  } catch (error) {
    console.error("Error approving leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function rejectLeaveRequest(requestId: string, rejectionReason: string) {
  try {
    const db = getDb();

    // Get current user
    const user = await getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or manager
    const userData = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData.length || !["admin", "manager"].includes(userData[0]?.role || '')) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    // If user is a manager (not admin), verify they are the assigned manager for this request
    if (userData[0]?.role === "manager") {
      const requestData = await db
        .select({ current_manager_id: leaveRequests.current_manager_id })
        .from(leaveRequests)
        .where(eq(leaveRequests.id, requestId))
        .limit(1);

      if (!requestData.length) {
        throw new Error("Leave request not found");
      }

      if (requestData[0]?.current_manager_id !== user.id) {
        throw new Error("Unauthorized: You can only reject requests for your team members");
      }
    }

    // Update the leave request
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

    // Revalidate both admin and manager paths
    revalidatePath("/admin");
    revalidatePath("/manager");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function cancelLeaveRequest(requestId: string, cancelReason: string) {
  try {
    const db = getDb();

    // Get current user
    const user = await getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or manager
    const userData = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData.length || !["admin", "manager"].includes(userData[0]?.role || '')) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    // If user is a manager (not admin), verify they are the assigned manager for this request
    if (userData[0]?.role === "manager") {
      const requestData = await db
        .select({ current_manager_id: leaveRequests.current_manager_id })
        .from(leaveRequests)
        .where(eq(leaveRequests.id, requestId))
        .limit(1);

      if (!requestData.length) {
        throw new Error("Leave request not found");
      }

      if (requestData[0]?.current_manager_id !== user.id) {
        throw new Error("Unauthorized: You can only cancel requests for your team members");
      }
    }

    // Update the leave request
    await db
      .update(leaveRequests)
      .set({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
        updated_at: new Date().toISOString()
      })
      .where(eq(leaveRequests.id, requestId));

    // Revalidate both admin and manager paths
    revalidatePath("/admin");
    revalidatePath("/manager");
    return { success: true };
  } catch (error) {
    console.error("Error canceling leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}