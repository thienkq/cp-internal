"use client";
import { useState } from "react";
import type { User } from "@/types";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { createBrowserClient } from "@workspace/supabase";

const roleOptions = [
  { label: "Employee", value: "employee" },
  { label: "Manager", value: "manager" },
  { label: "Admin", value: "admin" },
];
const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

type UserFormProps = {
  initialData: User | null;
  pageTitle: string;
};

export default function UserForm({ initialData, pageTitle }: UserFormProps) {
  const [form, setForm] = useState<Partial<User>>({
    email: initialData?.email || "",
    full_name: initialData?.full_name || "",
    role: initialData?.role || "employee",
    gender: initialData?.gender || undefined,
    position: initialData?.position || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (field: keyof User, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createBrowserClient();
    let res;
    if (initialData) {
      // Update existing user
      res = await supabase.from("users").update(form).eq("id", initialData.id);
    } else {
      // Add new user
      res = await supabase.from("users").insert([form]);
    }
    if (res.error) setMessage(res.error.message);
    else setMessage("Saved!");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-2">{pageTitle}</h2>
      <div>
        <label className="block mb-1 text-sm font-medium">Email</label>
        <Input
          value={form.email}
          onChange={e => handleChange("email", e.target.value)}
          required
          disabled={!!initialData}
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Full Name</label>
        <Input
          value={form.full_name}
          onChange={e => handleChange("full_name", e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Role</label>
        <Select
          value={form.role}
          onValueChange={value => handleChange("role", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Gender</label>
        <Select
          value={form.gender}
          onValueChange={value => handleChange("gender", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            {genderOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium">Position</label>
        <Input
          value={form.position}
          onChange={e => handleChange("position", e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full mt-4">
        {loading ? "Saving..." : "Save"}
      </Button>
      {message && <div className="text-green-600 mt-2">{message}</div>}
    </form>
  );
} 