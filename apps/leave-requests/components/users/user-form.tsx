"use client";
import type { User } from "@/types";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { createBrowserClient } from "@workspace/supabase";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@workspace/ui/components/label";
import { DatePicker } from "./date-picker";
import { UserSelect } from "./user-select";
import { toast } from "sonner";
import { genderOptions } from "./user-constants";
import { userSchema, getUserFormDefaults, normalizeUserFormData, UserFormValues } from "./user-form.utils";
import { User as UserIcon, Briefcase, Phone, Mail, Calendar, MapPin } from "lucide-react";

type UserFormProps = {
  initialData: User | null;
  pageTitle: string;
  canEditWorkInfo?: boolean; // default false
};

export default function UserForm({ initialData, pageTitle, canEditWorkInfo = false }: UserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
    control,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: getUserFormDefaults(initialData),
  });

  const onSubmit = async (data: UserFormValues) => {
    const supabase = createBrowserClient();
    const normalizedData = normalizeUserFormData(data);
    let res;
    if (initialData) {
      res = await supabase.from("users").update(normalizedData).eq("id", initialData.id).select();
    } else {
      res = await supabase.from("users").insert([normalizedData]).select();
    }
    if (res.error) {
      toast.error("Failed to save user.", { description: res.error.message });
      return;
    }
    if (!res.data || res.data.length === 0) {
      toast.error("Error: Operation failed.", { description: "The user may not exist or you may not have permission." });
      return;
    }
    toast.success("User saved successfully!");
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
        <Badge variant="blue" className="px-3 py-1">
          {initialData ? "Edit Profile" : "New User"}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info Section */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <UserIcon className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  Full Name *
                </Label>
                <Input 
                  {...register("full_name")} 
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.full_name && (
                  <div className="text-red-600 text-sm font-medium">{errors.full_name.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 text-green-500" />
                  Email *
                </Label>
                <Input 
                  {...register("email")} 
                  disabled={!!initialData}
                  className={`border-gray-300 focus:border-green-500 focus:ring-green-500 ${
                    !!initialData ? 'bg-gray-100' : ''
                  }`}
                />
                {errors.email && (
                  <div className="text-red-600 text-sm font-medium">{errors.email.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UserIcon className="h-4 w-4 text-purple-500" />
                  Gender
                </Label>
                <Select
                  value={watch("gender")}
                  onValueChange={value => setValue("gender", value as "male" | "female" | undefined)}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <div className="text-red-600 text-sm font-medium">{errors.gender.message}</div>
                )}
              </div>

              <Controller
                control={control}
                name="date_of_birth"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      Date of Birth
                    </Label>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      id="date_of_birth"
                      error={errors.date_of_birth?.message}
                    />
                  </div>
                )}
              />

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 text-teal-500" />
                  Phone
                </Label>
                <Input 
                  {...register("phone")} 
                  className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <div className="text-red-600 text-sm font-medium">{errors.phone.message}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Info Section */}
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50/50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Briefcase className="h-5 w-5" />
              Work Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  Manager
                </Label>
                <UserSelect
                  value={watch("manager_id") || undefined}
                  onChange={value => setValue("manager_id", value)}
                  excludeUserId={initialData?.id}
                  placeholder="Select manager"
                  disabled={isSubmitting}
                />
                {errors.manager_id && (
                  <div className="text-red-600 text-sm font-medium">{errors.manager_id.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="h-4 w-4 text-green-500" />
                  Position
                </Label>
                <Input 
                  {...register("position")} 
                  disabled={isSubmitting}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g. Senior Developer"
                />
                {errors.position && (
                  <div className="text-red-600 text-sm font-medium">{errors.position.message}</div>
                )}
              </div>

              <Controller
                control={control}
                name="start_date"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      Start Date
                    </Label>
                    {canEditWorkInfo ? (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        id="start_date"
                        error={errors.start_date?.message}
                      />
                    ) : (
                      <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                        {field.value ? new Date(field.value).toLocaleDateString() : "Not set"}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 