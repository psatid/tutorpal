import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";
import i18n from "@/lib/i18n/config";
import { Student } from "@/models/student";

const queryState = vi.hoisted(() => ({
	isLoading: false,
	students: [] as Student[],
}));

vi.mock("@/components/common/responsive-drawer", () => ({
	ResponsiveDrawer: ({
		children,
		footer,
		headerContent,
		onOpenChange,
		open,
		title,
	}: {
		children: React.ReactNode;
		footer?: React.ReactNode;
		headerContent?: React.ReactNode;
		onOpenChange: (open: boolean) => void;
		open: boolean;
		title: string;
	}) =>
		open ? (
			<section aria-label={title}>
				<button onClick={() => onOpenChange(false)} type="button">
					Dismiss student selector
				</button>
				{headerContent}
				{children}
				<footer>{footer}</footer>
			</section>
		) : null,
}));

vi.mock("@/hooks/queries/use-students", () => ({
	useStudents: () => ({
		data: { students: queryState.students },
		isLoading: queryState.isLoading,
	}),
}));

import { StudentSelectorDrawer } from "@/components/classes/student-selector-drawer";

function makeStudent(
	overrides: Partial<GetV1Students200DataItem> = {},
): Student {
	return Student.fromListItem({
		createdAt: "2026-10-12T00:00:00.000Z",
		grade: 5,
		id: "student-1",
		lineConnectionId: null,
		lineLinkStatus: "not_linked",
		lineUserId: null,
		name: "Ava Adams",
		phoneNumber: null,
		updatedAt: "2026-10-12T00:00:00.000Z",
		...overrides,
	});
}

type StudentSelectorDrawerProps = React.ComponentProps<
	typeof StudentSelectorDrawer
>;

function renderStudentSelectorDrawer(
	overrides: Partial<StudentSelectorDrawerProps> = {},
) {
	const props: StudentSelectorDrawerProps = {
		isOpen: true,
		onChange: vi.fn(),
		onOpenChange: vi.fn(),
		selectedIds: ["hidden-student"],
		...overrides,
	};

	return {
		...render(<StudentSelectorDrawer {...props} />),
		props,
	};
}

describe("StudentSelectorDrawer", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		queryState.isLoading = false;
		queryState.students = [
			makeStudent({ id: "hidden-student", name: "Bora Brown" }),
			makeStudent({ id: "ava", name: "Ava Adams" }),
			makeStudent({ id: "adam", name: "Adam Adams" }),
		];
	});

	it("bulk-selects filtered students without removing hidden selections before Done commits", async () => {
		const user = userEvent.setup();
		const { props } = renderStudentSelectorDrawer();

		await user.type(
			screen.getByPlaceholderText("Search students..."),
			"Ava",
		);

		expect(screen.getByRole("button", { name: "Select All" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Done (1)" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Select All" }));

		expect(
			screen.getByRole("button", { name: "Deselect All" }),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Done (2)" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Done (2)" }));

		expect(props.onChange).toHaveBeenCalledWith(["hidden-student", "ava"]);
		expect(props.onOpenChange).toHaveBeenCalledWith(false);
	});

	it("bulk-deselects only filtered students and keeps hidden selections", async () => {
		const user = userEvent.setup();
		const { props } = renderStudentSelectorDrawer({
			selectedIds: ["hidden-student", "ava"],
		});

		await user.type(
			screen.getByPlaceholderText("Search students..."),
			"Ava",
		);

		expect(
			screen.getByRole("button", { name: "Deselect All" }),
		).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Deselect All" }));

		expect(screen.getByRole("button", { name: "Select All" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Done (1)" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Done (1)" }));

		expect(props.onChange).toHaveBeenCalledWith(["hidden-student"]);
	});

	it("discards staged changes when dismissed and restores the incoming selection on reopen", async () => {
		const user = userEvent.setup();
		const { props, rerender } = renderStudentSelectorDrawer();

		await user.click(screen.getByRole("button", { name: /Ava Adams/ }));
		expect(screen.getByRole("button", { name: "Done (2)" })).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Dismiss student selector" }),
		);

		expect(props.onChange).not.toHaveBeenCalled();
		expect(props.onOpenChange).toHaveBeenCalledWith(false);

		rerender(<StudentSelectorDrawer {...props} isOpen={false} />);
		rerender(<StudentSelectorDrawer {...props} isOpen />);

		expect(screen.getByRole("button", { name: /Ava Adams/ })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "Done (1)" })).toBeVisible();
	});
});
