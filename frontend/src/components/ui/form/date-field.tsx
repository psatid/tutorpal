import { Calendar as CalendarIcon } from "lucide-react";
import {
  cloneElement,
  forwardRef,
  type ComponentProps,
  type MouseEventHandler,
  type ReactElement,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";

type DateFieldTriggerElement = ReactElement<ComponentProps<"button">>;

interface DateFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  selectionMode?: "single" | "week";
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  trigger?: DateFieldTriggerElement;
}

function DateField({
  value,
  onChange,
  selectionMode = "single",
  label,
  caption,
  error,
  required,
  disabled,
  placeholder,
  ariaLabel,
  className,
  trigger,
}: DateFieldProps) {
  const { t } = useTranslation("common");
  const resolvedPlaceholder = placeholder ?? t("form.chooseDate");
  const [isOpen, setIsOpen] = useState(false);
  const fieldId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputTriggerRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const date = DateTime.tryFromDateOnlyString(value)?.toDate();
  const weekRange =
    selectionMode === "week" && date
      ? {
          from: DateTime.from(date).startOfWeek().toDate(),
          to: DateTime.getWeekDates(date).at(-1)!.toDate(),
        }
      : undefined;
  const hasError = Array.isArray(error) ? error.length > 0 : Boolean(error);
  const captionId = caption ? `${fieldId}-description` : undefined;
  const errorId = hasError ? `${fieldId}-error` : undefined;
  const describedBy =
    [captionId, errorId].filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    if (trigger || !isDesktop || !isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [trigger, isDesktop, isOpen]);

  const handleSelect = (selected: Date | undefined) => {
    if (selected && onChange) {
      onChange(DateTime.from(selected).toDateOnlyString());
      setIsOpen(false);
    }
  };

  const calendar =
    selectionMode === "week" ? (
      <Calendar
        mode="range"
        selected={weekRange}
        onSelect={(_range, triggerDate) => handleSelect(triggerDate)}
        disabled={disabled}
        defaultMonth={date}
        weekStartsOn={1}
      />
    ) : (
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        disabled={disabled}
      />
    );

  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      caption={caption}
      captionId={captionId}
      error={error}
      errorId={errorId}
      required={required}
      disabled={disabled}
    >
      {isDesktop ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {trigger ? (
              <CustomDateFieldTrigger
                ref={triggerRef}
                disabled={disabled}
                className={className}
                trigger={trigger}
                id={fieldId}
                aria-label={ariaLabel}
                aria-describedby={describedBy}
                aria-invalid={hasError || undefined}
                data-state={isOpen ? "open" : "closed"}
              />
            ) : (
              <DateInputTrigger
                date={date}
                id={fieldId}
                aria-label={ariaLabel}
                aria-describedby={describedBy}
                aria-invalid={hasError || undefined}
                aria-expanded={isOpen}
                disabled={disabled}
                placeholder={resolvedPlaceholder}
                className={className}
                data-state={isOpen ? "open" : "closed"}
              />
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {calendar}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {trigger ? (
            <CustomDateFieldTrigger
              ref={triggerRef}
              disabled={disabled}
              className={className}
              trigger={trigger}
              id={fieldId}
              aria-label={ariaLabel}
              aria-describedby={describedBy}
              aria-invalid={hasError || undefined}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              data-state={isOpen ? "open" : "closed"}
              onClick={() => setIsOpen(true)}
            />
          ) : (
            <DateInputTrigger
              ref={inputTriggerRef}
              date={date}
              id={fieldId}
              aria-label={ariaLabel}
              aria-describedby={describedBy}
              aria-invalid={hasError || undefined}
              disabled={disabled}
              placeholder={resolvedPlaceholder}
              className={className}
              aria-expanded={isOpen}
              data-state={isOpen ? "open" : "closed"}
              onClick={() => setIsOpen(true)}
            />
          )}
          <ResponsiveDrawer
            open={isOpen}
            onOpenChange={setIsOpen}
            onCloseAutoFocus={() => {
              (trigger ? triggerRef.current : inputTriggerRef.current)?.focus();
            }}
            title={
              selectionMode === "week"
                ? t("form.chooseWeek")
                : t("form.chooseDate")
            }
            layer="nested"
          >
            {selectionMode === "week" ? (
              <Calendar
                fullWidth
                mode="range"
                selected={weekRange}
                onSelect={(_range, triggerDate) => handleSelect(triggerDate)}
                disabled={disabled}
                defaultMonth={date}
                weekStartsOn={1}
              />
            ) : (
              <Calendar
                fullWidth
                mode="single"
                selected={date}
                onSelect={handleSelect}
                disabled={disabled}
              />
            )}
          </ResponsiveDrawer>
        </>
      )}
    </FormField>
  );
}

const DateInputTrigger = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & {
    date?: Date;
    placeholder: string;
  }
>(function DateInputTrigger(
  { date, placeholder, className, onKeyDown, type: _type, ...props },
  ref,
) {
  return (
    <Input
      {...props}
      type="text"
      ref={ref}
      readOnly
      role="button"
      aria-haspopup="dialog"
      leftIcon={CalendarIcon}
      value={date ? DateTime.formatDate(date) : ""}
      placeholder={placeholder}
      className={cn(
        "cursor-pointer data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-primary/35",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    />
  );
});

const CustomDateFieldTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & { trigger: DateFieldTriggerElement }
>(function CustomDateFieldTrigger(
  { disabled, className, trigger, onClick, ...props },
  ref,
) {
  const triggerProps = trigger.props;
  const isDisabled = Boolean(disabled || triggerProps.disabled);
  const describedBy =
    [triggerProps["aria-describedby"], props["aria-describedby"]]
      .filter(Boolean)
      .join(" ") || undefined;
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    triggerProps.onClick?.(event);

    if (!event.defaultPrevented) {
      onClick?.(event);
    }
  };

  return cloneElement(trigger, {
    ...props,
    ref: (node: HTMLButtonElement | null) => {
      const triggerCleanup = setRef(triggerProps.ref, node);
      const forwardedCleanup = setRef(ref, node);

      return () => {
        forwardedCleanup?.();
        triggerCleanup?.();
      };
    },
    type: "button",
    disabled: isDisabled,
    className: cn(triggerProps.className, className),
    "aria-label": props["aria-label"] ?? triggerProps["aria-label"],
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? triggerProps["aria-invalid"],
    onClick: handleClick,
  });
});

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export { DateField, type DateFieldProps };
