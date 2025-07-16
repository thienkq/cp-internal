import type { Address } from "@/types";
import { useForm } from "react-hook-form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@workspace/ui/components/select";
import { toast } from "sonner";
import { createBrowserClient } from "@workspace/supabase";
import { useEffect } from "react";

export type AddressFormValues = {
  address_line: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  type?: string;
  is_primary: boolean;
};

type AddressFormProps = {
  userId: string;
  address: Address | null;
  onSuccess: () => void;
  onCancel: () => void;
};

const typeOptions = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

export default function AddressForm({ userId, address, onSuccess, onCancel }: AddressFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<AddressFormValues>({
    defaultValues: {
      address_line: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      type: "home",
      is_primary: false,
    },
  });

  useEffect(() => {
    if (address) {
      reset({
        address_line: address.address_line || "",
        city: address.city || "",
        state: address.state || "",
        postal_code: address.postal_code || "",
        country: address.country || "",
        type: address.type || "home",
        is_primary: address.is_primary || false,
      });
    } else {
      reset({
        address_line: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        type: "home",
        is_primary: false,
      });
    }
  }, [address, reset]);

  const onSubmit = async (data: AddressFormValues) => {
    const supabase = createBrowserClient();
    let res;
    if (address) {
      // Update
      res = await supabase.from("addresses").update({ ...data, user_id: userId }).eq("id", address.id).select();
    } else {
      // Insert
      res = await supabase.from("addresses").insert([{ ...data, user_id: userId }]).select();
    }
    if (res.error) {
      toast.error("Failed to save address.", { description: res.error.message });
      return;
    }
    // If set as primary, unset others
    if (data.is_primary && res.data && res.data[0]) {
      await supabase.from("addresses").update({ is_primary: false }).eq("user_id", userId).neq("id", res.data[0].id);
      await supabase.from("addresses").update({ is_primary: true }).eq("id", res.data[0].id);
    }
    toast.success("Address saved successfully!");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="mb-1">Address *</Label>
        <Input {...register("address_line", { required: "Address is required" })} />
        {errors.address_line && <div className="text-red-600 text-sm mt-1">{errors.address_line.message}</div>}
      </div>
      <div>
        <Label className="mb-1">City</Label>
        <Input {...register("city")} />
      </div>
      <div>
        <Label className="mb-1">State</Label>
        <Input {...register("state")} />
      </div>
      <div>
        <Label className="mb-1">Postal Code</Label>
        <Input {...register("postal_code")} />
      </div>
      <div>
        <Label className="mb-1">Country</Label>
        <Input {...register("country")} />
      </div>
      <div>
        <Label className="mb-1">Type</Label>
        <Select value={watch("type")} onValueChange={val => setValue("type", val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" {...register("is_primary")} id="is_primary" />
        <Label htmlFor="is_primary">Set as primary address</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
} 