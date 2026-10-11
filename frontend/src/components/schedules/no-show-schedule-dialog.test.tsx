import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type RefObject, useRef, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const mutation = vi.hoisted(() => ({
	error: null as Error | null,
	isError: false,
	isPending: false,
	mutate: vi.fn(),
	onSuccess: undefined as (() => void) | undefined,
	reset: vi.fn(),
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
	useNoShowSchedule: (options?: { onSuccess?: () => void }) => {
		mutation.onSuccess = options?.onSuccess;
		return {
			error: mutation.error,
			isError: mutation.isError,
			isPending: mutation.isPending,
			mutate: mutation.mutate,
			reset: mutation.reset,
		};
	},
}));

import {
	NoShowScheduleDialog,
	type NoShowSchedule,
} from "@/components/schedules/no-show-schedule-dialog";

const schedule: NoShowSchedule = {
	className: "Class one",
	date: "2026-10-08",
	durationMinutes: 90,
	id: "schedule-1",
	time: 540,
};

function renderDialog(options?: {
	finalFocus?: RefObject<HTMLElement | null>;
	onOpenChange?: (open: boolean) => void;
	onSuccess?: (nextSchedule: NoShowSchedule) => void;
}) {
	return render(
		<NoShowScheduleDialog
			finalFocus={options?.finalFocus}
			onOpenChange={options?.onOpenChange ?? vi.fn()}
			onSuccess={options?.onSuccess}
			open
			schedule={schedule}
		/>,
	);
}

function FocusReturnHarness() {
	const [open, setOpen] = useState(true);
	const finalFocus = useRef<HTMLButtonElement>(null);

	return (
		<>
			<button ref={finalFocus} type="button">
				Return to schedules
			</button>
			<NoShowScheduleDialog
				finalFocus={finalFocus}
				onOpenChange={setOpen}
				open={open}
				schedule={schedule}
			/>
		</>
	);
}

describe("NoShowScheduleDialog", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		mutation.error = null;
		mutation.isError = false;
		mutation.isPending = false;
		mutation.mutate.mockReset();
		mutation.onSuccess = undefined;
		mutation.reset.mockReset();
	});

	it("starts with no outcome selected, disables submission, and focuses the first choice", async () => {
		const user = userEvent.setup();
		renderDialog();

		const deduct = screen.getByRole("radio", {
			name: /Keep hours reserved/i,
		});
		const release = screen.getByRole("radio", {
			name: /Release the hours/i,
		});
		const dialog = screen.getByRole("dialog");
		expect(deduct).not.toBeChecked();
		expect(release).not.toBeChecked();
		expect(
			screen.getByRole("button", { name: "Choose an outcome" }),
		).toBeDisabled();
		expect(screen.getByLabelText("No-show note")).toBeEnabled();
		expect(dialog).toHaveClass(
			"w-[calc(100%-2rem)]",
			"max-w-lg",
			"max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
			"overflow-y-auto",
			"overscroll-contain",
		);

		await waitFor(() => expect(deduct).toHaveFocus());
		await user.keyboard("{ArrowDown}");
		expect(release).toBeChecked();
	});

	it("uses dark-safe background and foreground tokens for the session details", () => {
		renderDialog();

		const className = screen.getByText("Class one");
		const summaryCard = className.parentElement;
		const details = screen.getByText("Date").closest("dl");
		expect(summaryCard).toHaveClass("bg-muted");
		expect(summaryCard).not.toHaveClass("bg-surface-container-low");
		expect(className).toHaveClass("text-foreground");
		expect(className).not.toHaveClass("text-on-surface");
		expect(details).toHaveClass("text-muted-foreground");
		expect(details).not.toHaveClass("text-on-surface-variant");
		expect(screen.getByText("Date").nextElementSibling).toHaveClass(
			"text-foreground",
		);
	});

	it("returns focus to the supplied stable fallback after closing", async () => {
		const user = userEvent.setup();
		render(<FocusReturnHarness />);

		await user.click(screen.getByRole("button", { name: "Close" }));

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Return to schedules" }),
			).toHaveFocus(),
		);
	});

	it("submits the selected outcome with an optional, trimmed note", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(
			screen.getByRole("radio", { name: /Keep hours reserved/i }),
		);
		await user.type(screen.getByLabelText("No-show note"), "  Parent notified  ");
		await user.click(
			screen.getByRole("button", {
				name: "Mark no show and deduct 1.5 h",
			}),
		);

		expect(mutation.mutate).toHaveBeenCalledWith({
			deductHours: true,
			id: "schedule-1",
			note: "Parent notified",
		});
	});

	it("submits an outcome without requiring a no-show note", async () => {
		const user = userEvent.setup();
		renderDialog();

		await user.click(
			screen.getByRole("radio", { name: /Release the hours/i }),
		);
		await user.click(
			screen.getByRole("button", {
				name: "Cancel session and release 1.5 h",
			}),
		);

		expect(mutation.mutate).toHaveBeenCalledWith({
			deductHours: false,
			id: "schedule-1",
			note: undefined,
		});
	});

	it("keeps the selected outcome and note available after an error", async () => {
		const user = userEvent.setup();
		const { rerender } = renderDialog();

		const release = screen.getByRole("radio", { name: /Release the hours/i });
		const note = screen.getByLabelText("No-show note");
		await user.click(release);
		await user.type(note, "Learner did not attend");

		mutation.error = new Error("The session could not be updated.");
		mutation.isError = true;
		rerender(
			<NoShowScheduleDialog
				onOpenChange={vi.fn()}
				open
				schedule={schedule}
			/>,
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"The session could not be updated.",
		);
		expect(release).toBeChecked();
		expect(note).toHaveValue("Learner did not attend");
		expect(
			screen.getByRole("button", {
				name: "Cancel session and release 1.5 h",
			}),
		).toBeEnabled();
	});

	it("locks all controls while pending and closes after success", () => {
		const onOpenChange = vi.fn();
		const onSuccess = vi.fn();
		const { rerender } = renderDialog({ onOpenChange, onSuccess });

		mutation.isPending = true;
		rerender(
			<NoShowScheduleDialog
				onOpenChange={onOpenChange}
				onSuccess={onSuccess}
				open
				schedule={schedule}
			/>,
		);

		expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
		expect(
			screen.getByRole("radio", { name: /Keep hours reserved/i }),
		).toBeDisabled();
		expect(
			screen.getByRole("radio", { name: /Release the hours/i }),
		).toBeDisabled();
		expect(screen.getByLabelText("No-show note")).toBeDisabled();
		expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();

		mutation.isPending = false;
		act(() => mutation.onSuccess?.());
		expect(onSuccess).toHaveBeenCalledWith(schedule);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
