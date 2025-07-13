"use client";
import type { User } from "@/types";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { createBrowserClient } from "@workspace/supabase";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@workspace/ui/components/label";
import { DatePicker } from "./date-picker";
import { UserSelect } from "./user-select";
import { toast } from "sonner";
import { genderOptions } from "./user-constants";
import { userSchema, getUserFormDefaults, normalizeUserFormData, UserFormValues } from "./user-form.utils";


type UserFormProps = {
  initialData: User | null;
  pageTitle: string;
};

export default function UserForm({ initialData, pageTitle }: UserFormProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-2">{pageTitle}</h2>
      {/* Personal Info Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block mb-1 text-sm font-medium">Full Name</Label>
            <Input {...register("full_name")} />
            {errors.full_name && <div className="text-red-600">{errors.full_name.message}</div>}
          </div>
          <div>
            <Label className="block mb-1 text-sm font-medium">Email</Label>
            <Input {...register("email")} disabled={!!initialData} />
            {errors.email && <div className="text-red-600">{errors.email.message}</div>}
          </div>
          <div>
            <Label className="block mb-1 text-sm font-medium">Gender</Label>
            <Select
              value={watch("gender")}
              onValueChange={value => setValue("gender", value as "male" | "female" | undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && <div className="text-red-600">{errors.gender.message}</div>}
          </div>
          <Controller
            control={control}
            name="date_of_birth"
            render={({ field }) => (
              <DatePicker
                label="Date of Birth"
                value={field.value}
                onChange={field.onChange}
                id="date_of_birth"
                error={errors.date_of_birth?.message}
              />
            )}
          />
          <div>
            <Label className="block mb-1 text-sm font-medium">Phone</Label>
            <Input {...register("phone")} />
            {errors.phone && <div className="text-red-600">{errors.phone.message}</div>}
          </div>
        </div>
      </div>
      {/* Work Info Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Working Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <UserSelect
              value={watch("manager_id") || undefined}
              onChange={value => setValue("manager_id", value)}
              excludeUserId={initialData?.id}
              label="Manager"
              placeholder="Select manager"
              disabled={isSubmitting}
            />
            {errors.manager_id && <div className="text-red-600">{errors.manager_id.message}</div>}
          </div>
          <div>
            <Label className="block mb-1 text-sm font-medium">Position</Label>
            <Input {...register("position")} />
            {errors.position && <div className="text-red-600">{errors.position.message}</div>}
          </div>
          <Controller
            control={control}
            name="start_date"
            render={({ field }) => (
              <DatePicker
                label="Start Date"
                value={field.value}
                onChange={field.onChange}
                id="start_date"
                error={errors.start_date?.message}
              />
            )}
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto mt-4">
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
} 