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
} from '@/components/animate-ui/primitives/base/tabs';
import { cn } from '@/lib/utils';

type TabsProps = TabsPrimitiveProps;

function Tabs({ className, ...props }: TabsProps) {
  return (
    <TabsPrimitive
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

type TabsListProps = TabsListPrimitiveProps & {
  transition?: TabsHighlightPrimitiveProps["transition"];
};

function TabsList({ className, transition, ...props }: TabsListProps) {
  return (
    <TabsHighlightPrimitive
      transition={transition}
      className="absolute inset-x-0 inset-y-1.5 z-0 rounded-full bg-primary"
    >
      <TabsListPrimitive
        className={cn(
          "relative isolate inline-flex h-11 w-fit items-center justify-center rounded-full before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1 before:z-[-1] before:rounded-full before:border before:border-border before:bg-card",
          className,
        )}
        {...props}
      />
    </TabsHighlightPrimitive>
  );
}

type TabsTabProps = TabsTabPrimitiveProps;

function TabsTab({ className, ...props }: TabsTabProps) {
  return (
    <TabsHighlightItemPrimitive
      value={props.value}
      className="flex-1"
      suppressStateAttributes
    >
      <TabsTabPrimitive
        className={cn(
          "data-[active]:text-primary-foreground inline-flex h-11 min-w-11 w-full flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      />
    </TabsHighlightItemPrimitive>
  );
}

type TabsPanelsProps = TabsPanelsPrimitiveProps;

function TabsPanels(props: TabsPanelsProps) {
  return <TabsPanelsPrimitive {...props} />;
}

type TabsPanelProps = TabsPanelPrimitiveProps;

function TabsPanel({ className, ...props }: TabsPanelProps) {
  return (
    <TabsPanelPrimitive
      className={cn('flex-1 outline-none', className)}
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
