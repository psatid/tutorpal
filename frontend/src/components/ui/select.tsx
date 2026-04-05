import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string | null) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    { options, value, onChange, onBlur, placeholder, error, disabled, className },
    ref
  ) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className={cn("w-full", className)}>
        <SelectPrimitive.Root
          value={value}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            onBlur={onBlur}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border bg-surface-container-low px-4 py-3.5 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 font-body",
              error
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary",
              !value && "text-outline"
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder}>
              {selectedOption?.label || placeholder}
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon>
              <ChevronDown className="h-5 w-5 text-on-surface-variant" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
              className="z-[9999]"
              sideOffset={4}
              align="start"
            >
              <SelectPrimitive.Popup 
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-lg outline-none min-w-[var(--anchor-width)] overflow-hidden"
              >
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-colors font-body",
                      "hover:bg-surface-container-high focus:bg-surface-container-high data-[highlighted]:bg-surface-container-high",
                      value === option.value && "bg-primary/10 text-primary"
                    )}
                  >
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {error && <p className="text-error text-sm mt-1 font-body">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
export type { SelectOption };
