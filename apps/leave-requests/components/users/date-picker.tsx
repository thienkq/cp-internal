"use client";
import * as React from "react";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@workspace/ui/components/popover";
import { ChevronDownIcon } from "lucide-react";
import { Label } from "@workspace/ui/components/label";

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  error?: string;
  min?: string;
}

export function DatePicker({ label, value, onChange, id, error, min }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor={id} className="px-1">{label}</Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="justify-between font-normal"
            type="button"
            onClick={() => setOpen(!open)}
          >
            {value ? format(new Date(value), "yyyy-MM-dd") : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            captionLayout="dropdown"
            disabled={min ? (date) => {
              const minDate = startOfDay(parseISO(min));
              const currentDate = startOfDay(date);
              return isBefore(currentDate, minDate);
            } : undefined}
            onSelect={date => {
              onChange?.(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
} 