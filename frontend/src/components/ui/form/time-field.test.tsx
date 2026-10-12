import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimeField } from "./time-field";

describe("TimeField", () => {
	it("keeps a native time input readable beside a decorative clock", () => {
    const { container } = render(
      <TimeField
        id="schedule-time"
        label="Time"
        onChange={() => undefined}
        value="09:00"
      />,
    );

		const input = screen.getByLabelText("Time");
		const clock = container.querySelector<SVGSVGElement>(
			"svg.lucide-clock-3",
		);

		expect(input).toHaveAttribute("type", "time");
		expect(input).toHaveClass("w-full", "min-w-0", "pl-9");
		expect(clock).toHaveAttribute("aria-hidden", "true");
		expect(clock).toHaveClass("pointer-events-none", "absolute", "left-3");
		expect(input.parentElement).toContainElement(clock);
  });
});
