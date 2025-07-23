import type { Address } from "@/types";
import { useForm } from "react-hook-form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@workspace/ui/components/select";
import { toast } from "sonner";
import { createBrowserClient } from "@workspace/supabase";
import { useEffect } from "react";
import { MapPin, Home, Building, Globe, Mail, Star } from "lucide-react";

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
  { value: "home", label: "Home", icon: Home, color: "text-blue-500" },
  { value: "work", label: "Work", icon: Building, color: "text-green-500" },
  { value: "other", label: "Other", icon: MapPin, color: "text-purple-500" },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900">
          {address ? "Edit Address" : "Add New Address"}
        </h3>
        <Badge variant="blue" className="px-3 py-1">
          {address ? "Update Details" : "New Address"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Address Details Section */}
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="bg-orange-50/50">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <MapPin className="h-5 w-5" />
              Address Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Address Line */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Address *
                </Label>
                <Input 
                  {...register("address_line", { required: "Address is required" })} 
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="123 Main Street, Apt 4B"
                />
                {errors.address_line && (
                  <div className="text-red-600 text-sm font-medium">{errors.address_line.message}</div>
                )}
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building className="h-4 w-4 text-blue-500" />
                    City
                  </Label>
                  <Input 
                    {...register("city")} 
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-green-500" />
                    State
                  </Label>
                  <Input 
                    {...register("state")} 
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-purple-500" />
                    Postal Code
                  </Label>
                  <Input 
                    {...register("postal_code")} 
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="10001"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4 text-teal-500" />
                  Country
                </Label>
                <Input 
                  {...register("country")} 
                  className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="United States"
                />
              </div>

              {/* Type and Primary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Home className="h-4 w-4 text-indigo-500" />
                    Address Type
                  </Label>
                  <Select value={watch("type")} onValueChange={val => setValue("type", val)}>
                    <SelectTrigger className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(opt => {
                        const IconComponent = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className={`h-4 w-4 ${opt.color}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Primary Address
                  </Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Checkbox
                      id="is_primary"
                      checked={watch("is_primary")}
                      onCheckedChange={(checked) => setValue("is_primary", !!checked)}
                      className="border-gray-300 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                    />
                    <Label htmlFor="is_primary" className="text-sm text-gray-600">
                      Set as primary address
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              "Save Address"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 