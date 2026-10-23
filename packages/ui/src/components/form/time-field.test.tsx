import { fireEvent, render, screen } from "@testing-library/react";
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
			"svg",
		);

		expect(input).toHaveAttribute("type", "time");
		expect(input).toHaveClass(
			"w-full",
			"min-w-0",
			"pl-9",
			"appearance-none",
		);
		expect(clock).toHaveAttribute("aria-hidden", "true");
		expect(clock).toHaveClass("pointer-events-none", "absolute", "left-3");
		expect(input.parentElement).toContainElement(clock);
	});

	it("shows a localized hint only while an empty controlled field is unfocused", () => {
		const placeholder = "เลือกเวลา";
		const props = {
			id: "schedule-time",
			label: "Time",
			onChange: () => undefined,
			placeholder,
		};
		const { rerender } = render(<TimeField {...props} value="" />);
		const input = screen.getByLabelText("Time");

		const hint = screen.getByText(placeholder);
		expect(hint).toBeVisible();
		expect(hint).toHaveAttribute("aria-hidden", "true");
		expect(hint).toHaveClass("pointer-events-none");
		expect(input).not.toHaveAttribute("placeholder");

		fireEvent.focus(input);
		expect(screen.queryByText(placeholder)).not.toBeInTheDocument();

		fireEvent.blur(input);
		expect(screen.getByText(placeholder)).toBeVisible();

		rerender(<TimeField {...props} value="09:00" />);
		expect(screen.queryByText(placeholder)).not.toBeInTheDocument();

		rerender(<TimeField {...props} value="" />);
		expect(screen.getByText(placeholder)).toBeVisible();
	});
});
