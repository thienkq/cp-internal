"use client";
import type { User } from "@/types";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@workspace/ui/components/avatar";
import { createBrowserClient } from "@workspace/supabase";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@workspace/ui/components/label";
import { DatePicker } from "./date-picker";
import { UserSelect } from "./user-select";
import { toast } from "sonner";
import { genderOptions, roleOptions } from "./user-constants";
import { userSchema, getUserFormDefaults, normalizeUserFormData, UserFormValues } from "./user-form.utils";
import { User as UserIcon, Briefcase, Phone, Mail, Calendar, Edit3, UserPlus } from "lucide-react";
import { getUserInitials, getUserDisplayName } from "@/lib/utils";

type UserFormProps = {
  initialData: User | null;
  pageTitle: string;
  canEditWorkInfo?: boolean; // default false
  canEditRole?: boolean; // default false, only admins should be able to edit roles
};

export default function UserForm({ initialData, pageTitle, canEditWorkInfo = false, canEditRole = false }: UserFormProps) {
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

  // Get user avatar and display info
  const userInitials = initialData ? getUserInitials({ 
    user_metadata: { full_name: initialData.full_name },
    email: initialData.email 
  } as unknown as Parameters<typeof getUserInitials>[0]) : "U";
  const displayName = initialData ? getUserDisplayName({ 
    user_metadata: { full_name: initialData.full_name },
    email: initialData.email 
  } as unknown as Parameters<typeof getUserDisplayName>[0]) : "New User";

  return (
    <div className="mx-auto space-y-8">
      {/* Enhanced Header with Avatar */}
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          {/* User Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-lg">
              <AvatarImage 
                src="" 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {/* Edit indicator */}
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
              {initialData ? (
                <Edit3 className="w-3 h-3" />
              ) : (
                <UserPlus className="w-3 h-3" />
              )}
            </div>
          </div>
          
          {/* Title and Badge */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {pageTitle}
            </h1>
            <Badge 
              variant="blue" 
              className="px-4 py-2 text-sm font-medium shadow-sm"
            >
              {initialData ? "Edit Profile" : "Create New User"}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info Section */}
        <Card className="shadow-lg border-l-4 border-l-primary hover:shadow-xl transition-shadow duration-200 pt-0 overflow-hidden">
          <CardHeader className="!pt-[14px] !pb-[10px] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-primary/10">
            <CardTitle className="flex items-center gap-3 text-foreground text-xl font-semibold">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Personal Information
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  Full Name *
                </Label>
                <Input 
                  {...register("full_name")} 
                  className="border-border focus:border-primary focus:ring-primary"
                />
                {errors.full_name && (
                  <div className="text-destructive text-sm font-medium">{errors.full_name.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-green-500" />
                  Email *
                </Label>
                <Input 
                  {...register("email")} 
                  disabled={!!initialData}
                  className={`border-border focus:border-green-500 focus:ring-green-500 ${initialData ? 'bg-muted' : ''}`}
                />
                {errors.email && (
                  <div className="text-destructive text-sm font-medium">{errors.email.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserIcon className="h-4 w-4 text-purple-500" />
                  Gender
                </Label>
                <Select
                  value={watch("gender")}
                  onValueChange={value => setValue("gender", value as "male" | "female" | undefined)}
                >
                  <SelectTrigger className="w-full border-border focus:border-purple-500 focus:ring-purple-500">
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
                  <div className="text-destructive text-sm font-medium">{errors.gender.message}</div>
                )}
              </div>

              <Controller
                control={control}
                name="date_of_birth"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
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
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Phone className="h-4 w-4 text-teal-500" />
                  Phone
                </Label>
                <Input 
                  {...register("phone")} 
                  className="border-border focus:border-teal-500 focus:ring-teal-500"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <div className="text-destructive text-sm font-medium">{errors.phone.message}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Info Section */}
        <Card className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-shadow duration-200 pt-0 overflow-hidden">
          <CardHeader className="!pt-[14px] !pb-[10px] bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b border-green-500/10">
            <CardTitle className="flex items-center gap-3 text-foreground text-xl font-semibold">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Work Information
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {canEditRole && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <UserIcon className="h-4 w-4 text-red-500" />
                    Role *
                  </Label>
                  <Select
                    value={watch("role")}
                    onValueChange={value => setValue("role", value as "employee" | "manager" | "admin")}
                  >
                    <SelectTrigger className="w-full border-border focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <div className="text-destructive text-sm font-medium">{errors.role.message}</div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
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
                  <div className="text-destructive text-sm font-medium">{errors.manager_id.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Briefcase className="h-4 w-4 text-green-500" />
                  Position
                </Label>
                <Input 
                  {...register("position")} 
                  disabled={isSubmitting}
                  className="border-border focus:border-green-500 focus:ring-green-500"
                  placeholder="e.g. Senior Developer"
                />
                {errors.position && (
                  <div className="text-destructive text-sm font-medium">{errors.position.message}</div>
                )}
              </div>

              <Controller
                control={control}
                name="start_date"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
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
                      <div className="px-3 py-2 border border-border rounded-md bg-muted text-foreground">
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
        <div className="flex justify-center pt-6">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="cursor-pointer px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-base">Saving Changes...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-base">
                {initialData ? (
                  <>
                    <Edit3 className="w-5 h-5" />
                    Update Profile
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create User
                  </>
                )}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 