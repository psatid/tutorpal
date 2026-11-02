import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClassHourAdditionsSection } from "@/components/classes/class-hour-additions-section";
import i18n from "@/lib/i18n/config";

const queryState = vi.hoisted(() => ({
	additions: [] as Array<{
		getListItemData: () => {
			formattedCreatedAt: string;
			formattedHours: string;
			formattedRevenueAmount: string | null;
			id: string;
			source: "course" | "custom";
			sourceCourseName: string | null;
		};
	}>,
	fetchNextPage: vi.fn(),
	hasNextPage: false,
	isError: false,
	isFetchingNextPage: false,
	isLoading: false,
	refetch: vi.fn(),
}));

vi.mock("@/hooks/queries/use-infinite-class-hour-additions", () => ({
	useInfiniteClassHourAdditions: () => ({
		data: { pages: [{ additions: queryState.additions }] },
		fetchNextPage: queryState.fetchNextPage,
		hasNextPage: queryState.hasNextPage,
		isError: queryState.isError,
		isFetchingNextPage: queryState.isFetchingNextPage,
		isLoading: queryState.isLoading,
		refetch: queryState.refetch,
	}),
}));

function makeAddition(id: string) {
	return {
		getListItemData: () => ({
			formattedCreatedAt: `October ${id}, 2026`,
			formattedHours: "2",
			formattedRevenueAmount: "฿500.00",
			id,
			source: "custom" as const,
			sourceCourseName: null,
		}),
	};
}

describe("ClassHourAdditionsSection", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		queryState.additions = [makeAddition("1"), makeAddition("2"), makeAddition("3")];
		queryState.hasNextPage = false;
		queryState.isError = false;
		queryState.isLoading = false;
		vi.clearAllMocks();
	});

	it("previews two history entries and expands the remaining loaded history on request", async () => {
		const user = userEvent.setup();
		render(<ClassHourAdditionsSection classId="class-1" />);

		expect(screen.getByText("October 1, 2026")).toBeVisible();
		expect(screen.getByText("October 2, 2026")).toBeVisible();
		expect(screen.queryByText("October 3, 2026")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "View all" }));
		expect(screen.getByText("October 3, 2026")).toBeVisible();
		expect(screen.getByRole("button", { name: "Show less" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "Show less" }));
		expect(screen.queryByText("October 3, 2026")).not.toBeInTheDocument();
	});

	it("keeps an error retryable", async () => {
		const user = userEvent.setup();
		queryState.isError = true;
		render(<ClassHourAdditionsSection classId="class-1" />);

		expect(screen.getByRole("alert")).toHaveTextContent("history couldn’t load");
		await user.click(screen.getByRole("button", { name: "Retry" }));
		expect(queryState.refetch).toHaveBeenCalledTimes(1);
	});
});
