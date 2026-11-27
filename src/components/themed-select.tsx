"use client";

import { Children, isValidElement, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OptionData = { value: string; label: React.ReactNode; disabled: boolean };

type ThemedSelectProps = {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
  children: React.ReactNode;
};

// Radix items cannot use "" as a value, but "All topics" style options need it.
const EMPTY = "__empty__";

function readOptions(children: React.ReactNode): OptionData[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: React.ReactNode }>(child)) return [];
    return [{ value: String(child.props.value ?? ""), label: child.props.children, disabled: Boolean(child.props.disabled) }];
  });
}

// A drop-in for a native <select> with <option> children, drawn in the app's theme.
// It submits through a hidden input, so form posts and GET filter forms keep working.
export function ThemedSelect({ name, id, value, defaultValue, onChange, disabled, className, children, ...rest }: ThemedSelectProps) {
  const options = readOptions(children);
  const [ownValue, setOwnValue] = useState(defaultValue ?? options.find((option) => !option.disabled)?.value ?? "");
  const current = value ?? ownValue;
  const placeholder = options.find((option) => option.value === "" && option.disabled)?.label;

  function change(next: string) {
    const real = next === EMPTY ? "" : next;
    setOwnValue(real);
    onChange?.({ target: { value: real } });
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <Select value={current === "" && placeholder ? undefined : current === "" ? EMPTY : current} onValueChange={change} disabled={disabled}>
        <SelectTrigger id={id} aria-label={rest["aria-label"]} className={cn("h-11 min-w-40", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((option) => !(option.value === "" && option.disabled))
            .map((option) => (
              <SelectItem key={option.value || EMPTY} value={option.value === "" ? EMPTY : option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </>
  );
}
