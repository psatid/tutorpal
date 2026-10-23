import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";
import { ClassCard } from "@/components/classes/class-card";
import { ClassInfoHeader } from "@/components/classes/class-info-header";
import { ClassRow } from "@/components/classes/class-row";
import i18n from "@/lib/i18n/config";
import { Class } from "@/models/class";

function makeClass(
	overrides: Partial<GetV1ClassesById200> = {},
): Class {
	return Class.fromGetClassByIdResponse({
		createdAt: "2026-10-12T00:00:00.000Z",
		displayName: "Algebra 1",
		id: "class-1",
		name: "Algebra 1",
		recordedRevenue: 1200,
		remainingHours: 0,
		scheduledHours: 10,
		students: [],
		totalHours: 10,
		updatedAt: "2026-10-12T00:00:00.000Z",
		usedHours: 0,
		...overrides,
	});
}

describe("class-hour surfaces", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
	});

	it("renders the all-scheduled accounting state in the class card and row", () => {
		const classData = makeClass();

		const card = render(
			<ClassCard
				classData={classData}
				onDelete={vi.fn()}
				onView={vi.fn()}
			/>,
		);

		expect(screen.getByText("0/10 hours")).toBeVisible();
		expect(screen.getByText("All hours scheduled")).toBeVisible();
		expect(screen.getByText("Scheduled 10 · Used 0")).toBeVisible();

		card.unmount();

		render(
			<ul>
				<ClassRow
					actionTriggerRef={vi.fn()}
					item={classData}
					onAddHours={vi.fn()}
					onDelete={vi.fn()}
					onEdit={vi.fn()}
					onOpen={vi.fn()}
				/>
			</ul>,
		);

		const accounting = screen.getAllByText("Scheduled 10 · Used 0");
		expect(accounting).toHaveLength(2);
		expect(accounting[0]).toHaveClass("sm:hidden");
		const desktopAccounting = accounting[1];
		if (!desktopAccounting) {
			throw new Error("Expected desktop accounting copy");
		}
		expect(desktopAccounting.parentElement).toHaveClass("hidden", "sm:block");
		expect(screen.getAllByText("All hours scheduled")).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: "Actions for Algebra 1" }),
		).toHaveClass("self-start");
	});

	it("uses active deductions, rather than reserved hours, for detail progress", () => {
		render(
			<ClassInfoHeader
				classData={makeClass({
					remainingHours: 0,
					scheduledHours: 7,
					usedHours: 3,
				})}
				onAddHours={vi.fn()}
				onBack={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		expect(screen.getByText("All hours scheduled")).toBeVisible();
		expect(screen.getByText("Scheduled 7 · Used 3")).toBeVisible();

		const progress = screen.getByRole("progressbar", {
			name: "Hours used",
		});
		expect(progress).toHaveAttribute("aria-valuemin", "0");
		expect(progress).toHaveAttribute("aria-valuemax", "10");
		expect(progress).toHaveAttribute("aria-valuenow", "3");
		expect(progress).toHaveAttribute("aria-valuetext", "3 of 10 hours used");
	});

	it("localizes the accounting line and state labels in Thai", async () => {
		await i18n.changeLanguage("th");

		render(
			<ClassCard
				classData={makeClass()}
				onDelete={vi.fn()}
				onView={vi.fn()}
			/>,
		);

		expect(screen.getByText("0/10 ชั่วโมง")).toBeVisible();
		expect(screen.getByText("นัดชั่วโมงครบแล้ว")).toBeVisible();
		expect(screen.getByText("นัดแล้ว 10 · ใช้แล้ว 0")).toBeVisible();
	});
});
