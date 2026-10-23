import {
  Tabs as TabsPrimitive,
  TabsList as TabsListPrimitive,
  TabsTab as TabsTabPrimitive,
  TabsPanel as TabsPanelPrimitive,
  TabsPanels as TabsPanelsPrimitive,
  TabsHighlight as TabsHighlightPrimitive,
  TabsHighlightItem as TabsHighlightItemPrimitive,
  type TabsProps as TabsPrimitiveProps,
  type TabsHighlightProps as TabsHighlightPrimitiveProps,
  type TabsListProps as TabsListPrimitiveProps,
  type TabsTabProps as TabsTabPrimitiveProps,
  type TabsPanelProps as TabsPanelPrimitiveProps,
  type TabsPanelsProps as TabsPanelsPrimitiveProps,
} from "../../primitives/base/tabs";
import { createContext, useContext } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../../../lib/utils";
import { CONTENT_REVEAL_TRANSITION } from "../../reveal";

const TABS_PANELS_TRANSITION = {
  type: "spring",
  stiffness: 200,
  damping: 25,
} as const;
type TabsProps = TabsPrimitiveProps;

type TabsListVariant = "default" | "subtle";

const TabsListVariantContext = createContext<TabsListVariant>("default");

function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

type TabsListProps = TabsListPrimitiveProps & {
  transition?: TabsHighlightPrimitiveProps["transition"];
  variant?: TabsListVariant;
};

function TabsList({
  className,
  transition,
  variant = "default",
  ...props
}: TabsListProps) {
  const prefersReducedMotion = useReducedMotion() === true;
  const isSubtle = variant === "subtle";

  return (
    <TabsListVariantContext.Provider value={variant}>
      <TabsHighlightPrimitive
        transition={
          isSubtle && prefersReducedMotion ? { duration: 0 } : transition
        }
        className={
          isSubtle
            ? "absolute inset-x-0 inset-y-1 z-0 rounded-full bg-primary"
            : "absolute inset-x-0 inset-y-1.5 z-0 rounded-full bg-primary"
        }
      >
        <TabsListPrimitive
          className={cn(
            isSubtle
              ? "relative isolate inline-flex h-11 w-max max-w-none items-center justify-start rounded-full"
              : "relative isolate inline-flex h-11 w-fit items-center justify-center rounded-full before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:z-[-1] before:rounded-full before:border before:border-border before:bg-card",
            className,
          )}
          {...props}
        />
      </TabsHighlightPrimitive>
    </TabsListVariantContext.Provider>
  );
}

type TabsTabProps = TabsTabPrimitiveProps;

function TabsTab({ className, ...props }: TabsTabProps) {
  const variant = useContext(TabsListVariantContext);

  return (
    <TabsHighlightItemPrimitive
      value={props.value}
      className={variant === "subtle" ? "flex-none" : "flex-1"}
      suppressStateAttributes
    >
      <TabsTabPrimitive
        className={cn(
          variant === "subtle"
            ? "inline-flex h-11 min-w-11 w-auto shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[color,font-weight,background-color] duration-200 motion-reduce:transition-none hover:bg-muted hover:text-foreground data-[active]:font-semibold data-[active]:text-primary-foreground data-[active]:hover:bg-transparent data-[active]:hover:text-primary-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[active]:focus-visible:ring-primary-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            : "data-[active]:text-primary-foreground inline-flex h-11 min-w-11 w-full flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      />
    </TabsHighlightItemPrimitive>
  );
}

type TabsPanelsProps = TabsPanelsPrimitiveProps;

function TabsPanels({ transition, ...props }: TabsPanelsProps) {
  const prefersReducedMotion = useReducedMotion() === true;

  return (
    <TabsPanelsPrimitive
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : (transition ?? TABS_PANELS_TRANSITION)
      }
      {...props}
    />
  );
}

type TabsPanelProps = TabsPanelPrimitiveProps;

function TabsPanel({ className, transition, ...props }: TabsPanelProps) {
  const prefersReducedMotion = useReducedMotion() === true;

  return (
    <TabsPanelPrimitive
      className={cn("flex-1 outline-none", className)}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : (transition ?? CONTENT_REVEAL_TRANSITION)
      }
      {...props}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsTab,
  TabsPanels,
  TabsPanel,
  type TabsProps,
  type TabsListProps,
  type TabsTabProps,
  type TabsPanelsProps,
  type TabsPanelProps,
};
