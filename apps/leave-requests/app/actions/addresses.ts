"use server";

import { getDb } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Address } from "@/types";
import { requireAuth } from "@/lib/auth-utils";

export async function getAddressesByUserId(userId: string): Promise<Address[]> {
  // TODO: Add authorization check (verify user can access this user's addresses)
  const db = getDb();
  const result = await db
    .select()
    .from(addresses)
    .where(eq(addresses.user_id, userId))
    .orderBy(addresses.created_at);
  return result as Address[];
}

export async function createAddress(addressData: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Address; error?: string }> {
  // TODO: Add authorization check (verify user can create address for this user)
  try {
    const db = getDb();
    
    // If this is being set as primary, unset other primary addresses
    if (addressData.is_primary) {
      await db
        .update(addresses)
        .set({ is_primary: false })
        .where(and(
          eq(addresses.user_id, addressData.user_id),
          eq(addresses.is_primary, true)
        ));
    }
    
    const [newAddress] = await db.insert(addresses).values(addressData).returning();
    return { success: true, data: newAddress as Address };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAddress(addressId: string, addressData: Partial<Omit<Address, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data?: Address; error?: string }> {
  // TODO: Add authorization check (verify user can update this address)
  try {
    const db = getDb();
    
    // If this is being set as primary, unset other primary addresses
    if (addressData.is_primary && addressData.user_id) {
      await db
        .update(addresses)
        .set({ is_primary: false })
        .where(and(
          eq(addresses.user_id, addressData.user_id),
          eq(addresses.is_primary, true)
        ));
    }
    
    const [updatedAddress] = await db
      .update(addresses)
      .set({ ...addressData, updated_at: new Date().toISOString() })
      .where(eq(addresses.id, addressId))
      .returning();
    return { success: true, data: updatedAddress as Address };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Add authorization check (verify user can delete this address)
  try {
    const db = getDb();
    await db.delete(addresses).where(eq(addresses.id, addressId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setPrimaryAddress(addressId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Add authorization check (verify user can set primary address for this user)
  try {
    const db = getDb();
    
    // First unset all primary addresses for this user
    await db
      .update(addresses)
      .set({ is_primary: false })
      .where(eq(addresses.user_id, userId));
    
    // Then set the specified address as primary
    await db
      .update(addresses)
      .set({ is_primary: true })
      .where(eq(addresses.id, addressId));
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
