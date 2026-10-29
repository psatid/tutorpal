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

function renderClassRow(classData: Class) {
	return render(
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
}

function getClassRowButton(name = "View details for Algebra 1") {
	return screen.getByRole("button", {
		name,
	});
}

describe("class-hour surfaces", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
	});

	it("retains the all-scheduled accounting state in the class card", () => {
		const classData = makeClass();

		render(
			<ClassCard
				classData={classData}
				onDelete={vi.fn()}
				onView={vi.fn()}
			/>,
		);

		expect(screen.getByText("0/10 hours")).toBeVisible();
		expect(screen.getByText("All hours scheduled")).toBeVisible();
		expect(screen.getByText("Scheduled 10 · Used 0")).toBeVisible();
	});

	it("shows deduction-based hours left in ClassRow instead of capacity accounting", () => {
		renderClassRow(
			makeClass({
				remainingHours: 0,
				scheduledHours: 7,
				usedHours: 3,
			}),
		);

		const row = getClassRowButton();
		expect(row).toHaveTextContent("7 hours left");
		expect(screen.queryByText("Available 0 hours")).not.toBeInTheDocument();
		expect(screen.queryByText("All hours scheduled")).not.toBeInTheDocument();
		expect(screen.queryByText("0/10 hours")).not.toBeInTheDocument();
		expect(screen.queryByText("Scheduled 7 · Used 3")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Actions for Algebra 1" }),
		).toHaveClass("self-start");
	});

	it("shows the full total as hours left when every hour is only scheduled", () => {
		renderClassRow(
			makeClass({
				remainingHours: 0,
				scheduledHours: 10,
				usedHours: 0,
			}),
		);

		expect(getClassRowButton()).toHaveTextContent("10 hours left");
	});

	it("floors over-deducted ClassRow hours left at zero", () => {
		renderClassRow(
			makeClass({
				scheduledHours: 0,
				usedHours: 13,
			}),
		);

		expect(getClassRowButton()).toHaveTextContent("0 hours left");
	});

	it("shows the no-hours message when the ClassRow total is zero", () => {
		renderClassRow(
			makeClass({
				remainingHours: 0,
				scheduledHours: 0,
				totalHours: 0,
				usedHours: 0,
			}),
		);

		expect(getClassRowButton()).toHaveTextContent("No hours added yet");
		const summaries = screen
			.getAllByText("No hours added yet")
			.filter((element) => element.tagName === "P");
		expect(summaries).toHaveLength(2);
		for (const summary of summaries) {
			expect(summary).toHaveClass("text-muted-foreground");
		}
	});

	it("formats singular and fractional English ClassRow hours left", () => {
		const singular = renderClassRow(
			makeClass({
				scheduledHours: 0,
				totalHours: 1,
				usedHours: 0,
			}),
		);

		expect(getClassRowButton()).toHaveTextContent("1 hour left");
		singular.unmount();

		const fractional = renderClassRow(
			makeClass({
				scheduledHours: 0,
				totalHours: 2.5,
				usedHours: 1,
			}),
		);

		expect(getClassRowButton()).toHaveTextContent("1.5 hours left");
		fractional.unmount();

		renderClassRow(
			makeClass({
				scheduledHours: 0,
				totalHours: 1.02,
				usedHours: 1 / 60,
			}),
		);

		expect(getClassRowButton()).toHaveTextContent("1 hour left");
	});

	it("includes student names and the hours-left summary in the ClassRow description", () => {
		renderClassRow(
			makeClass({
				remainingHours: 0,
				scheduledHours: 7,
				students: [
					{
						grade: 6,
						id: "student-1",
						name: "Ada Lovelace",
						phoneNumber: null,
					},
					{
						grade: 7,
						id: "student-2",
						name: "Grace Hopper",
						phoneNumber: null,
					},
				],
				usedHours: 3,
			}),
		);

		expect(getClassRowButton()).toHaveAccessibleDescription(
			"Ada Lovelace, Grace Hopper. 7 hours left",
		);
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

	it("localizes the ClassRow hours-left label in Thai", async () => {
		await i18n.changeLanguage("th");

		renderClassRow(
			makeClass({
				remainingHours: 0,
				scheduledHours: 7,
				usedHours: 3,
			}),
		);

		expect(
			getClassRowButton("ดูรายละเอียดของ Algebra 1"),
		).toHaveTextContent("เหลือ 7 ชั่วโมง");
	});
});
