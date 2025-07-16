"use client";

import { useState } from "react";
import type { Address } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import AddressForm from "./address-form";
import { createBrowserClient } from "@workspace/supabase";
import { toast } from "sonner";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@workspace/ui/components/alert-dialog";

// Helper to fetch addresses
async function fetchAddresses(userId: string): Promise<Address[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from("addresses").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data || [];
}

type AddressListProps = {
  addresses: Address[];
  userId: string;
};

export default function AddressList({ addresses: initialAddresses, userId }: AddressListProps) {
  const [open, setOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  // Refresh addresses from DB
  const refreshAddresses = async () => {
    setFetching(true);
    setError(null);
    try {
      setAddresses(await fetchAddresses(userId));
    } catch (err: any) {
      setError(err.message || "Failed to fetch addresses.");
      toast.error("Failed to fetch addresses.", { description: err.message });
    }
    setFetching(false);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setOpen(true);
  };
  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setOpen(true);
  };
  const handleDelete = async () => {
    if (!addressToDelete) return;
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.from("addresses").delete().eq("id", addressToDelete.id);
    if (error) {
      toast.error("Failed to delete address.", { description: error.message });
    } else {
      toast.success("Address deleted.");
      await refreshAddresses();
    }
    setLoading(false);
    setDeleteDialogOpen(false);
    setAddressToDelete(null);
  };
  const handleSetDefault = async (addressId: string) => {
    setLoading(true);
    const supabase = createBrowserClient();
    try {
      await supabase.from("addresses").update({ is_primary: false }).eq("user_id", userId);
      const { error } = await supabase.from("addresses").update({ is_primary: true }).eq("id", addressId);
      if (error) {
        throw new Error(error.message);
      }
      toast.success("Primary address updated.");
      await refreshAddresses();
    } catch (err: any) {
      toast.error("Failed to set primary address.", { description: err.message });
    }
    setLoading(false);
  };
  const handleSuccess = async () => {
    setOpen(false);
    await refreshAddresses();
  };
  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleAdd} className="mb-4" disabled={loading || fetching}>Add Address</Button>
      {(loading || fetching) && (
        <div className="mb-4">
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
        </div>
      )}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {!loading && !fetching && addresses.length === 0 && !error && (
        <div className="text-gray-500 mb-4">No addresses found. Add your first address!</div>
      )}
      <ul className="space-y-4">
        {addresses.map(addr => (
          <li key={addr.id} className="border p-4 rounded flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div>{addr.address_line}</div>
              <div>{addr.city}{addr.state && ", " + addr.state}{addr.postal_code && ", " + addr.postal_code}</div>
              <div>{addr.country}</div>
              {addr.is_primary && <span className="text-green-600 font-semibold">Primary</span>}
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button size="sm" variant="outline" onClick={() => handleEdit(addr)} disabled={loading || fetching}>Edit</Button>
              <AlertDialog open={deleteDialogOpen && addressToDelete?.id === addr.id} onOpenChange={(open: boolean) => {
                setDeleteDialogOpen(open);
                if (!open) setAddressToDelete(null);
              }}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setAddressToDelete(addr);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={loading || fetching}
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Address</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this address? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
                      {loading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {!addr.is_primary && <Button size="sm" variant="secondary" onClick={() => handleSetDefault(addr.id)} disabled={loading || fetching}>Set as Primary</Button>}
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {/* Hidden trigger, we control open state manually */}
          <span style={{ display: "none" }} />
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{editingAddress ? "Edit Address" : "Add Address"}</DialogTitle>
          <AddressForm
            userId={userId}
            address={editingAddress}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 