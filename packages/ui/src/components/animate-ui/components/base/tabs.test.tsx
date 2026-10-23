import { render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const reducedMotionState = vi.hoisted(() => ({ value: false }));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();

  return {
    ...actual,
    useReducedMotion: () => reducedMotionState.value,
  };
});

vi.mock("../../primitives/effects/highlight", () => ({
  Highlight: ({
    children,
    className,
    transition,
    value,
  }: {
    children: React.ReactNode;
    className?: string;
    transition?: object;
    value?: string;
  }) => (
    <div
      data-class-name={className}
      data-testid="tabs-highlight"
      data-transition={JSON.stringify(transition)}
      data-value={value}
    >
      {children}
    </div>
  ),
  HighlightItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { Tabs, TabsList, TabsTab } from "./tabs";

function TabFixture({
  value,
  variant,
}: {
  value: string;
  variant?: "default" | "subtle";
}) {
  return (
    <Tabs value={value}>
      <TabsList aria-label="Status" variant={variant}>
        <TabsTab value="ALL">All</TabsTab>
        <TabsTab value="SCHEDULED">Scheduled</TabsTab>
      </TabsList>
    </Tabs>
  );
}

describe("TabsList", () => {
  afterEach(() => {
    reducedMotionState.value = false;
    document.documentElement.classList.remove("dark");
  });

  (["light", "dark"] as const).forEach((theme) => {
    it(`uses a solid primary subtle highlight in the ${theme} theme`, () => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      render(<TabFixture value="ALL" variant="subtle" />);

      const highlightClasses = screen
        .getByTestId("tabs-highlight")
        .getAttribute("data-class-name");

      expect(highlightClasses).toMatch(/(?:^|\s)bg-primary(?:\s|$)/);
      expect(highlightClasses).not.toContain("bg-primary-container");
      expect(highlightClasses).not.toContain("dark:bg-");
    });
  });

  it("uses an immediate subtle highlight transition for reduced motion and follows the controlled value", () => {
    reducedMotionState.value = true;
    const { rerender } = render(<TabFixture value="ALL" variant="subtle" />);

    const highlight = screen.getByTestId("tabs-highlight");
    expect(highlight).toHaveAttribute("data-transition", '{"duration":0}');
    expect(highlight).toHaveAttribute("data-value", "ALL");

    rerender(<TabFixture value="SCHEDULED" variant="subtle" />);

    expect(highlight).toHaveAttribute("data-value", "SCHEDULED");
  });

  it("uses the spring highlight transition for subtle tabs without reduced motion", () => {
    reducedMotionState.value = false;
    render(<TabFixture value="ALL" variant="subtle" />);

    expect(screen.getByTestId("tabs-highlight")).toHaveAttribute(
      "data-transition",
      '{"type":"spring","stiffness":200,"damping":25}',
    );
  });

  it("keeps the selected subtle label primary and inactive tabs muted", () => {
    render(<TabFixture value="ALL" variant="subtle" />);

    const selected = screen.getByRole("tab", { name: "All" });
    const inactive = screen.getByRole("tab", { name: "Scheduled" });

    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveAttribute("data-active", "");
    expect(selected).toHaveClass(
      "data-[active]:text-primary-foreground",
      "data-[active]:focus-visible:ring-primary-foreground",
    );

    expect(inactive).toHaveAttribute("aria-selected", "false");
    expect(inactive).not.toHaveAttribute("data-active");
    expect(inactive).toHaveClass(
      "text-muted-foreground",
      "hover:bg-muted",
      "hover:text-foreground",
    );
    expect(inactive).not.toHaveClass("text-primary-foreground");
    expect(inactive).not.toHaveClass("font-semibold");
  });

  it("keeps the default list and tab presentation", () => {
    reducedMotionState.value = false;
    render(<TabFixture value="ALL" />);

    expect(screen.getByRole("tablist", { name: "Status" })).toHaveClass(
      "w-fit",
      "justify-center",
      "before:border",
      "before:bg-card",
    );
    expect(screen.getByRole("tab", { name: "All" })).toHaveClass(
      "w-full",
      "flex-1",
      "data-[active]:text-primary-foreground",
    );
    expect(screen.getByTestId("tabs-highlight")).toHaveAttribute(
      "data-class-name",
      expect.stringContaining("bg-primary"),
    );
    expect(screen.getByTestId("tabs-highlight")).toHaveAttribute(
      "data-class-name",
      expect.not.stringContaining("bg-primary-container"),
    );
  });
});
