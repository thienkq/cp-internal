"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Calendar } from "lucide-react";

interface LeaveRequestYearFilterProps {
  selectedYear: number;
}

export function LeaveRequestYearFilter({ selectedYear }: LeaveRequestYearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Generate year options (current year + 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams);
    if (year === currentYear.toString()) {
      params.delete("year");
    } else {
      params.set("year", year);
    }
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year === currentYear ? `${year} (Current)` : year.toString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 