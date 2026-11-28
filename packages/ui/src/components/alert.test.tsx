import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "./alert";

describe("Alert", () => {
  it("exposes a semantic default alert with a decorative icon and an optional action", () => {
    render(
      <Alert>
        <AlertIcon>
          <svg data-testid="alert-glyph" />
        </AlertIcon>
        <AlertTitle>Lessons need attention</AlertTitle>
        <AlertDescription>Review the outstanding sessions.</AlertDescription>
        <AlertAction>
          <button type="button">Review sessions</button>
        </AlertAction>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    const icon = alert.querySelector('[data-slot="alert-icon"]');

    expect(alert).toHaveAttribute("data-variant", "default");
    expect(alert).toHaveAttribute("data-size", "default");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("size-5");
    expect(icon).toContainElement(screen.getByTestId("alert-glyph"));
    expect(alert.querySelector('[data-slot="alert-title"]')).toHaveTextContent(
      "Lessons need attention",
    );
    expect(alert.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
      "Review the outstanding sessions.",
    );
    expect(alert.querySelector('[data-slot="alert-action"]')).toContainElement(
      screen.getByRole("button", { name: "Review sessions" }),
    );
  });

  it.each([
    ["warning", "compact"],
    ["destructive", "default"],
  ] as const)("exposes the %s variant at %s density", (variant, size) => {
    render(
      <Alert size={size} variant={variant}>
        <AlertDescription>Message</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole("alert");

    expect(alert).toHaveAttribute("data-variant", variant);
    expect(alert).toHaveAttribute("data-size", size);
  });

  it("keeps title, description, and action independently optional", () => {
    render(
      <Alert variant="warning">
        <AlertIcon>
          <svg />
        </AlertIcon>
        <AlertDescription>Only the message is needed here.</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole("alert");

    expect(alert.querySelector('[data-slot="alert-title"]')).not.toBeInTheDocument();
    expect(alert.querySelector('[data-slot="alert-action"]')).not.toBeInTheDocument();
    expect(alert.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
      "Only the message is needed here.",
    );
  });
});
