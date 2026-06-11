"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Thin wrapper over the shadcn (Base UI) Select for the common
 * "pick one of a fixed list" case. Keeps every dropdown consistent and
 * encapsulates the Base UI composition in one place.
 */
export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  return (
    // Base UI Select shows the raw value in the trigger unless given both an
    // `items` map and a render-function child on SelectValue — the established
    // pattern across valeon/plutarc/vocasync.
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      items={options}
    >
      <SelectTrigger id={id} className={cn("h-9 w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {(v) =>
            options.find((o) => o.value === v)?.label ?? placeholder ?? ""
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
