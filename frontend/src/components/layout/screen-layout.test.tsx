import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScreenLayout, ScreenLayoutEdge } from "./screen-layout";

describe("ScreenLayout", () => {
  it("provides the shared authenticated-screen gutters at every breakpoint", () => {
    render(<ScreenLayout data-testid="screen">Screen content</ScreenLayout>);

    expect(screen.getByTestId("screen")).toHaveClass(
      "min-w-0",
      "bg-background",
      "p-3",
      "sm:p-4",
      "lg:p-6",
    );
  });

  it("supports full and mobile-only gutter escapes", () => {
    render(
      <>
        <ScreenLayoutEdge data-testid="full-edge">Full edge content</ScreenLayoutEdge>
        <ScreenLayoutEdge data-testid="mobile-edge" mobileOnly>
          Mobile edge content
        </ScreenLayoutEdge>
      </>,
    );

    expect(screen.getByTestId("full-edge")).toHaveClass(
      "-mx-3",
      "sm:-mx-4",
      "lg:-mx-6",
    );
    expect(screen.getByTestId("mobile-edge")).toHaveClass("-mx-3", "sm:mx-0");
  });
});
