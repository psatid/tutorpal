import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const responsiveDrawerProps = vi.hoisted(() => ({
  contentClassName: undefined as string | undefined,
  popupStyle: undefined as React.CSSProperties | undefined,
}));

const calendarProps = vi.hoisted(() => ({
  fixedWeeks: undefined as boolean | undefined,
  fullWidth: undefined as boolean | undefined,
}));

vi.mock("@/components/ui/responsive-drawer", () => ({
  ResponsiveDrawer: ({
    children,
    contentClassName,
    open,
    popupStyle,
  }: {
    children: React.ReactNode;
    contentClassName?: string;
    open: boolean;
    popupStyle?: React.CSSProperties;
  }) => {
    responsiveDrawerProps.contentClassName = contentClassName;
    responsiveDrawerProps.popupStyle = popupStyle;

    return open ? <div data-testid="responsive-drawer">{children}</div> : null;
  },
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ fixedWeeks, fullWidth }: {
    fixedWeeks?: boolean;
    fullWidth?: boolean;
  }) => {
    calendarProps.fixedWeeks = fixedWeeks;
    calendarProps.fullWidth = fullWidth;

    return <div data-testid="calendar" />;
  },
}));

import { DateField } from "./date-field";

function mockViewport(desktop: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: query === "(min-width: 768px)" && desktop,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe("DateField", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    responsiveDrawerProps.contentClassName = undefined;
    responsiveDrawerProps.popupStyle = undefined;
    calendarProps.fixedWeeks = undefined;
    calendarProps.fullWidth = undefined;
  });

  it("uses a safe-area-aware, scrollable six-week calendar drawer on mobile", async () => {
    mockViewport(false);
    const user = userEvent.setup();
    render(<DateField label="Date" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Date" }));

    expect(screen.getByTestId("responsive-drawer")).toBeInTheDocument();
    expect(responsiveDrawerProps.popupStyle).toEqual({
      maxHeight:
        "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
    });
    expect(responsiveDrawerProps.contentClassName).toContain("min-h-0");
    expect(responsiveDrawerProps.contentClassName).toContain("overflow-y-auto");
    expect(responsiveDrawerProps.contentClassName).toContain("overscroll-contain");
    expect(responsiveDrawerProps.contentClassName).toContain("px-1");
    expect(responsiveDrawerProps.contentClassName).toContain(
      "safe-area-inset-bottom",
    );
    expect(calendarProps.fullWidth).toBe(true);
    expect(calendarProps.fixedWeeks).toBe(true);
  });

  it("keeps the desktop popover calendar natural-height", async () => {
    mockViewport(true);
    const user = userEvent.setup();
    render(<DateField label="Date" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Date" }));

    expect(screen.getByTestId("calendar")).toBeInTheDocument();
    expect(responsiveDrawerProps.popupStyle).toBeUndefined();
    expect(responsiveDrawerProps.contentClassName).toBeUndefined();
    expect(calendarProps.fullWidth).toBeUndefined();
    expect(calendarProps.fixedWeeks).toBeUndefined();
  });
});
