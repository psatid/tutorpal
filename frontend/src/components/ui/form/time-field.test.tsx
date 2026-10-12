import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimeField } from "./time-field";

describe("TimeField", () => {
  it("keeps the native time input free of an overlapping custom icon", () => {
    const { container } = render(
      <TimeField
        id="schedule-time"
        label="Time"
        onChange={() => undefined}
        value="09:00"
      />,
    );

    const input = screen.getByLabelText("Time");

    expect(input).toHaveAttribute("type", "time");
    expect(input).toHaveClass("w-full", "min-w-0");
    expect(input.className).not.toContain("calendar-picker-indicator");
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
