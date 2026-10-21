import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const mutations = vi.hoisted(() => ({
	create: vi.fn(),
	update: vi.fn(),
}));

vi.mock("@/hooks/mutations/use-courses", () => ({
	useCreateCourse: () => ({ isPending: false, mutate: mutations.create }),
	useUpdateCourse: () => ({ isPending: false, mutate: mutations.update }),
}));

import { CourseForm } from "@/components/courses/course-form";

const pendingPreview =
	"Enter valid hours and price to see the default revenue.";

function renderCourseForm() {
	return render(<CourseForm course={null} onSaved={vi.fn()} />);
}

describe("CourseForm revenue preview", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		mutations.create.mockReset();
		mutations.update.mockReset();
	});

	it("keeps the preview pending when an hourly price is blank", async () => {
		const user = userEvent.setup();
		renderCourseForm();

		await user.type(screen.getByLabelText("Preset hours"), "2");

		expect(screen.getByText(pendingPreview)).toBeVisible();
	});

	it.each([
		["hours are incomplete", ""],
		["hours are not positive", "0"],
	])("keeps the hourly preview pending when %s", async (_, hours) => {
		const user = userEvent.setup();
		renderCourseForm();

		await user.type(screen.getByLabelText("Hourly rate (THB)"), "10");
		if (hours) {
			await user.type(screen.getByLabelText("Preset hours"), hours);
		}

		expect(screen.getByText(pendingPreview)).toBeVisible();
	});

	it("shows a fixed-price preview without preset hours", async () => {
		const user = userEvent.setup();
		renderCourseForm();

		await user.click(
			screen.getByRole("radio", { name: /Fixed package price/ }),
		);
		await user.type(
			screen.getByLabelText("Fixed package price (THB)"),
			"120",
		);

		expect(
			screen.getByText("฿120.00 for this course preset"),
		).toBeVisible();
	});

	it("formats a zero fixed price as currency", async () => {
		const user = userEvent.setup();
		renderCourseForm();

		await user.click(
			screen.getByRole("radio", { name: /Fixed package price/ }),
		);
		await user.type(
			screen.getByLabelText("Fixed package price (THB)"),
			"0",
		);

		expect(
			screen.getByText("฿0.00 for this course preset"),
		).toBeVisible();
	});
});
