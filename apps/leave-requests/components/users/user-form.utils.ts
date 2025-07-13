import { z } from "zod";
import type { User } from "@/types";

export const userSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  full_name: z.string().min(1, "Full name is required"),
  gender: z.enum(["male", "female"]).optional(),
  position: z.string().optional(),
  phone: z.string().min(8, "Phone number is too short").max(20, "Phone number is too long").optional().or(z.literal("")),
  date_of_birth: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format").optional(),
  manager_id: z.string().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
});

export type UserFormValues = z.infer<typeof userSchema>;

export function getUserFormDefaults(initialData: User | null): UserFormValues {
  return {
    email: initialData?.email || "",
    full_name: initialData?.full_name || "",
    gender: (initialData?.gender as "male" | "female" | undefined) || undefined,
    position: initialData?.position || "",
    phone: initialData?.phone || "",
    date_of_birth: initialData?.date_of_birth || "",
    manager_id: initialData?.manager_id || "",
    start_date: initialData?.start_date || "",
  };
}

export function normalizeUserFormData(data: UserFormValues) {
  return {
    ...data,
    date_of_birth: data.date_of_birth || null,
    start_date: data.start_date || null,
    manager_id: data.manager_id || null,
    phone: data.phone || null,
    position: data.position || null,
    gender: data.gender || null,
  };
} 