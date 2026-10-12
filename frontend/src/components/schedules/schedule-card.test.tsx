import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import i18n from "@/lib/i18n/config";

const longClassName =
	"Advanced Algebra preparation with an intentionally long class name";

function makeSchedule(
	overrides: Partial<GetV1Schedules200Item> = {},
): GetV1Schedules200Item {
	return {
		classId: "class-1",
		className: longClassName,
		createdAt: "2026-10-12T00:00:00.000Z",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		noShowNote: null,
		notes: null,
		status: "SCHEDULED",
		time: 540,
		type: "ONLINE",
		updatedAt: "2026-10-12T00:00:00.000Z",
		...overrides,
	};
}

describe("ScheduleCard", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
	});

	it("keeps the status badge beside a truncating long class name", () => {
		render(
			<ScheduleCard
				onDelete={vi.fn()}
				onView={vi.fn()}
				schedule={makeSchedule()}
			/>,
		);

		const className = screen.getByText(longClassName);
		const status = screen.getByText("Scheduled");

		expect(status).toHaveAttribute("data-slot", "badge");
		expect(className).toHaveClass("min-w-0", "flex-1", "truncate");
		expect(status).toHaveClass("shrink-0", "border-info/25");
		expect(className.parentElement).toContainElement(status);
		expect(className.parentElement).toHaveClass("flex", "min-w-0", "items-center");
	});

	it("uses the Thai localized status without changing the compact name-and-badge layout", async () => {
		await i18n.changeLanguage("th");

		render(
			<ScheduleCard
				onDelete={vi.fn()}
				onView={vi.fn()}
				schedule={makeSchedule({ status: "COMPLETED" })}
			/>,
		);

		expect(screen.getByText("เสร็จสิ้น")).toHaveClass(
			"shrink-0",
			"border-success/25",
		);
		expect(screen.getByText(longClassName)).toHaveClass("truncate");
	});
});
