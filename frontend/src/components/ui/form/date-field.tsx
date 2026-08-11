import { Calendar as CalendarIcon } from "lucide-react";
import {
  cloneElement,
  forwardRef,
  type ComponentProps,
  type MouseEventHandler,
  type ReactElement,
  type Ref,
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
  placeholder = "Pick a date",
  ariaLabel,
  className,
  trigger,
}: DateFieldProps) {
  const { t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const fieldId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
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
            <DateFieldTrigger
              date={date}
              id={fieldId}
              aria-label={ariaLabel}
              aria-describedby={describedBy}
              aria-invalid={hasError || undefined}
              disabled={disabled}
              placeholder={placeholder}
              className={className}
              trigger={trigger}
              data-state={isOpen ? "open" : "closed"}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {calendar}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          <DateFieldTrigger
            ref={triggerRef}
            date={date}
            id={fieldId}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={hasError || undefined}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
            trigger={trigger}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            data-state={isOpen ? "open" : "closed"}
            onClick={() => setIsOpen(true)}
          />
          <ResponsiveDrawer
            open={isOpen}
            onOpenChange={setIsOpen}
            onCloseAutoFocus={() => triggerRef.current?.focus()}
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

const DateFieldTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & {
    date?: Date;
    placeholder: string;
    trigger?: DateFieldTriggerElement;
  }
>(function DateFieldTrigger(
  { date, disabled, placeholder, className, trigger, ...props },
  ref,
) {
  if (trigger) {
    return (
      <CustomDateFieldTrigger
        ref={ref}
        disabled={disabled}
        className={className}
        trigger={trigger}
        {...props}
      />
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "flex h-11 w-full min-w-0 items-center justify-start gap-2 rounded-lg border border-input bg-input/30 px-3 py-1 text-left text-base transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-primary/40 md:text-sm",
        !date && "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <CalendarIcon className="size-4 shrink-0" />
      <span className="min-w-0 truncate">
        {date ? DateTime.from(date).format("PPP") : placeholder}
      </span>
    </button>
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
