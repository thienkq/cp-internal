"use client";

import { useState } from "react";
import type { Address } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
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
import { MapPin, Home, Building, Star, Plus, Edit, Trash2, Crown } from "lucide-react";

// Helper to fetch addresses
async function fetchAddresses(userId: string): Promise<Address[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from("addresses").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data || [];
}

// Get icon and color for address type
const getAddressTypeIcon = (type: string) => {
  switch (type) {
    case "home":
      return { icon: Home, color: "text-blue-500", bgColor: "bg-blue-50" };
    case "work":
      return { icon: Building, color: "text-green-500", bgColor: "bg-green-50" };
    default:
      return { icon: MapPin, color: "text-purple-500", bgColor: "bg-purple-50" };
  }
};

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

  // Sort addresses: primary first, then by created_at descending
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    // Optional: sort by created_at descending
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">My Addresses</h3>
          <p className="text-sm text-gray-600">Manage your saved addresses</p>
        </div>
        <Button 
          onClick={handleAdd} 
          disabled={loading || fetching}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Loading State */}
      {(loading || fetching) && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !fetching && addresses.length === 0 && !error && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No addresses found</h4>
            <p className="text-gray-500 mb-4">Add your first address to get started!</p>
            <Button onClick={handleAdd} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Address Cards */}
      <div className="grid gap-4">
        {sortedAddresses.map(addr => {
          const typeInfo = getAddressTypeIcon(addr.type || "other");
          const IconComponent = typeInfo.icon;
          
          return (
            <Card key={addr.id} className={`shadow-sm border-l-4 ${addr.is_primary ? 'border-l-yellow-500 bg-yellow-50/30' : 'border-l-gray-300'} hover:shadow-md transition-shadow duration-200`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Address Info */}
                  <div className="flex-1 space-y-3">
                    {/* Header with icon and type */}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${typeInfo.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {addr.type || "Other"}
                          </Badge>
                          {addr.is_primary && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Star className="h-3 w-3 mr-1" />
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{addr.address_line}</div>
                      <div className="text-gray-600">
                        {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}
                      </div>
                      {addr.country && (
                        <div className="text-gray-500">{addr.country}</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row md:flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(addr)} 
                      disabled={loading || fetching}
                      className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    
                    {!addr.is_primary && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSetDefault(addr.id)} 
                        disabled={loading || fetching}
                        className="flex items-center gap-1 hover:bg-yellow-50 hover:border-yellow-300"
                      >
                        <Crown className="h-3 w-3" />
                        Set Primary
                      </Button>
                    )}
                    
                    <AlertDialog open={deleteDialogOpen && addressToDelete?.id === addr.id} onOpenChange={(open: boolean) => {
                      setDeleteDialogOpen(open);
                      if (!open) setAddressToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAddressToDelete(addr);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={loading || fetching}
                          className="flex items-center gap-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
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
                          <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={loading} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {loading ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span style={{ display: "none" }} />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
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