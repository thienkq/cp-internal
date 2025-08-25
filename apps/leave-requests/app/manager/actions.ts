"use server";

import { createServerClient } from "@workspace/supabase";
import { revalidatePath } from "next/cache";

export async function approveLeaveRequest(requestId: string, approvalNotes?: string) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or manager
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || !userData || !["admin", "manager"].includes(userData.role)) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    // If user is a manager (not admin), verify they are the assigned manager for this request
    if (userData.role === "manager") {
      const { data: requestData, error: requestError } = await supabase
        .from("leave_requests")
        .select("current_manager_id")
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        throw new Error("Leave request not found");
      }

      if (requestData.current_manager_id !== user.id) {
        throw new Error("Unauthorized: You can only approve requests for your team members");
      }
    }

    // Update the leave request
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        approved_by_id: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) throw error;

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
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or manager
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || !userData || !["admin", "manager"].includes(userData.role)) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    // If user is a manager (not admin), verify they are the assigned manager for this request
    if (userData.role === "manager") {
      const { data: requestData, error: requestError } = await supabase
        .from("leave_requests")
        .select("current_manager_id")
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        throw new Error("Leave request not found");
      }

      if (requestData.current_manager_id !== user.id) {
        throw new Error("Unauthorized: You can only reject requests for your team members");
      }
    }

    // Update the leave request
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        approved_by_id: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) throw error;

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
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Check if user is admin or manager
    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || !userData || !["admin", "manager"].includes(userData.role)) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }

    // If user is a manager (not admin), verify they are the assigned manager for this request
    if (userData.role === "manager") {
      const { data: requestData, error: requestError } = await supabase
        .from("leave_requests")
        .select("current_manager_id")
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        throw new Error("Leave request not found");
      }

      if (requestData.current_manager_id !== user.id) {
        throw new Error("Unauthorized: You can only cancel requests for your team members");
      }
    }

    // Update the leave request
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);
    
    if (error) throw error;

    // Revalidate both admin and manager paths
    revalidatePath("/admin");
    revalidatePath("/manager");
    return { success: true };
  } catch (error) {
    console.error("Error canceling leave request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}