import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "@/components/common/badge";

const variants = [
	["primary", "border-primary/25", "bg-primary-container", "text-primary-pressed"],
	["neutral", "border-border", "bg-muted", "text-secondary-foreground"],
	["destructive", "border-destructive/25", "bg-destructive/10", "text-destructive"],
	["success", "border-success/25", "bg-success-container", "text-success-container-foreground"],
	["info", "border-info/25", "bg-info-container", "text-info-container-foreground"],
	["warning", "border-warning/25", "bg-warning-container", "text-warning-container-foreground"],
] as const;

describe("Badge", () => {
	it("defaults to the light purple primary presentation", () => {
		render(<Badge>Primary</Badge>);

		const badge = screen.getByText("Primary");
		expect(badge).toHaveClass(
			"rounded-md",
			"border",
			"border-primary/25",
			"bg-primary-container",
			"text-primary-pressed",
		);
	});

	it.each(variants)(
		"renders the %s semantic variant with a light fill, colored border, and colored text",
		(variant, borderClass, fillClass, textClass) => {
			render(<Badge variant={variant}>{variant}</Badge>);

			expect(screen.getByText(variant)).toHaveClass(
				"border",
				borderClass,
				fillClass,
				textClass,
			);
		},
	);

	it("keeps the exported default variant aligned with primary", () => {
		expect(badgeVariants()).toContain("border-primary/25");
		expect(badgeVariants()).toContain("bg-primary-container");
	});
});
