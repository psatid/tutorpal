import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import {
  DrawerOverlayPortalContext,
  resolveDrawerOverlayPortalContainer,
} from "@/components/ui/drawer-overlay-portal-context";
import { cn } from "@/lib/utils";

function Select<Value, Multiple extends boolean | undefined = false>({
  modal,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const drawerContext = React.useContext(DrawerOverlayPortalContext);
  const resolvedModal = modal ?? drawerContext?.modal;

  return <SelectPrimitive.Root modal={resolvedModal} {...props} />;
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "md",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "md";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        `flex w-full items-center justify-between gap-1.5 rounded-md border border-input bg-white px-3
        py-2 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] 
        focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive 
        aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-active:border-primary 
        data-active:bg-primary/10 data-active:text-primary data-active:[&_svg]:text-primary 
        dark:data-active:border-primary dark:data-active:bg-primary dark:data-active:text-primary-foreground 
        dark:data-active:[&_svg]:text-primary-foreground data-placeholder:text-muted-foreground 
        data-[size=md]:h-11 data-[size=sm]:h-9 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex 
        *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 hover:border-input-hover
        [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer`,
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <HugeiconsIcon
            icon={UnfoldMoreIcon}
            strokeWidth={2}
            className="pointer-events-none size-4 text-muted-foreground"
          />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const drawerContext = React.useContext(DrawerOverlayPortalContext);
  const portalContainer = resolveDrawerOverlayPortalContainer(drawerContext);

  return (
    <SelectPrimitive.Portal container={portalContainer || undefined}>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="pointer-events-none isolate z-50"
      >
        <SelectPrimitive.Popup
          data-base-ui-swipe-ignore
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "pointer-events-auto relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-transient-popover duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-3 py-2.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        `relative flex w-full cursor-md items-center gap-2.5 rounded py-2 pr-8 pl-3 text-sm outline-hidden 
        select-none focus:bg-primary-container focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground 
        data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 
        [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2`,
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          className="pointer-events-none"
        />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-border/50",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-md items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-md items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
    </SelectPrimitive.ScrollDownArrow>
  );
}

type SelectInputOption<T = string> = {
  value: T;
  label: string;
};

type SelectInputProps<T> = SelectPrimitive.Root.Props<T> & {
  options: SelectInputOption<T>[];
  placeholder?: string;
  className?: string;
};

const SelectInput = <T,>({
  options,
  placeholder,
  className,
  ...props
}: SelectInputProps<T>) => {
  return (
    <Select items={options} {...props}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option, index) => (
          <SelectItem key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectInput,
  type SelectInputOption,
  type SelectInputProps,
};
