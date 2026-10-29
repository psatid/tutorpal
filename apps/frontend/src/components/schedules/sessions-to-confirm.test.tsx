import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import { Schedule, type ScheduleDisplayInput } from "@/models/schedule";

type Page = {
  pagination: { hasNext: boolean; nextCursor: string | null; total: number };
  schedules: Schedule[];
};

const queryState = vi.hoisted(() => ({
  data: undefined as { pageParams: unknown[]; pages: Page[] } | undefined,
  dataUpdatedAt: 0,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isError: false,
  isFetchNextPageError: false,
  isFetchingNextPage: false,
  isLoading: false,
  refetch: vi.fn(),
}));
const awaitingConfirmationHook = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/queries/use-infinite-awaiting-confirmation-schedules", () => ({
  useInfiniteAwaitingConfirmationSchedules: () => {
    awaitingConfirmationHook();
    return queryState;
  },
}));

vi.mock("@/components/schedules/complete-schedule-dialog", () => ({
  CompleteScheduleDialog: ({
    onOpenChange,
    onSuccess,
    schedule,
  }: {
    onOpenChange: (open: boolean) => void;
    onSuccess?: (schedule: Schedule) => void;
    schedule: Schedule | null;
  }) =>
    schedule ? (
      <div aria-label="Complete confirmation" role="alertdialog">
        <button
          onClick={() => {
            onSuccess?.(schedule);
            onOpenChange(false);
          }}
          type="button"
        >
          Confirm complete success
        </button>
        <button onClick={() => onOpenChange(false)} type="button">
          Confirm complete failure
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/schedules/no-show-schedule-dialog", () => ({
  NoShowScheduleDialog: ({
    onOpenChange,
    onSuccess,
    open,
    schedule,
  }: {
    onOpenChange: (open: boolean) => void;
    onSuccess?: (schedule: Schedule) => void;
    open: boolean;
    schedule: Schedule | null;
  }) =>
    open && schedule ? (
      <div aria-label="No-show confirmation" role="dialog">
        <button
          onClick={() => {
            onSuccess?.(schedule);
            onOpenChange(false);
          }}
          type="button"
        >
          Confirm no-show success
        </button>
        <button onClick={() => onOpenChange(false)} type="button">
          Confirm no-show failure
        </button>
      </div>
    ) : null,
}));

import { SessionsToConfirm } from "@/components/schedules/sessions-to-confirm";

function makeSchedule(
  overrides: Partial<ScheduleDisplayInput> = {},
): Schedule {
  return Schedule.fromInput({
    className: "Algebra foundations",
    date: "2026-10-12",
    durationMinutes: 60,
    id: "schedule-1",
    time: 9 * 60,
    type: "ONLINE",
    ...overrides,
  });
}

function page(schedules: Schedule[], options: Partial<Page["pagination"]> = {}): Page {
  return {
    pagination: {
      hasNext: options.hasNext ?? false,
      nextCursor: options.nextCursor ?? null,
      total: options.total ?? schedules.length,
    },
    schedules,
  };
}

function setPages(pages: Page[], total = pages[0]?.pagination.total ?? 0) {
  queryState.data = {
    pageParams: pages.map((_, index) => (index ? `cursor-${index}` : null)),
    pages: pages.map((nextPage) => ({
      ...nextPage,
      pagination: { ...nextPage.pagination, total },
    })),
  };
}

function renderSessions(onCloseAutoFocus = vi.fn()) {
  return {
    ...render(<SessionsToConfirm onCloseAutoFocus={onCloseAutoFocus} />),
    onCloseAutoFocus,
  };
}

async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
  const banner = screen.getByRole("button", {
    name: /sessions? needs? confirmation Review sessions/,
  });
  await user.click(banner);
  return {
    banner,
    drawer: await screen.findByRole("dialog", { name: "Sessions to confirm" }),
  };
}

describe("SessionsToConfirm", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    awaitingConfirmationHook.mockReset();
    queryState.data = undefined;
    queryState.dataUpdatedAt = 0;
    queryState.fetchNextPage.mockReset();
    queryState.fetchNextPage.mockResolvedValue(undefined);
    queryState.hasNextPage = false;
    queryState.isError = false;
    queryState.isFetchNextPageError = false;
    queryState.isFetchingNextPage = false;
    queryState.isLoading = false;
    queryState.refetch.mockReset();
  });

  it("uses the server total beyond the first page and groups globally ordered pages by date", async () => {
    const user = userEvent.setup();
    setPages(
      [
        page(
          [
            makeSchedule({
              className: "Oldest algebra",
              date: "2026-10-10",
              id: "schedule-1",
              notes: "Learner Ava Adams",
            }),
            makeSchedule({
              className: "Morning geometry",
              date: "2026-10-11",
              id: "schedule-2",
            }),
          ],
          { hasNext: true, nextCursor: "cursor-2", total: 12 },
        ),
        page(
          [
            makeSchedule({
              className: "Afternoon geometry",
              date: "2026-10-11",
              id: "schedule-3",
              time: 14 * 60,
            }),
          ],
          { total: 12 },
        ),
      ],
      12,
    );
    queryState.hasNextPage = true;
    renderSessions();

    const banner = screen.getByRole("button", {
      name: "12 sessions need confirmation Review sessions",
    });
    expect(within(banner).getByText("12")).toHaveAttribute("aria-hidden", "true");
    expect(banner).toHaveAttribute(
      "aria-labelledby",
      "sessions-to-confirm-banner-title sessions-to-confirm-banner-action",
    );
    expect(banner).toHaveAttribute(
      "aria-describedby",
      "sessions-to-confirm-banner-description",
    );
    expect(
      document.getElementById("sessions-to-confirm-banner-title"),
    ).toHaveTextContent("12 sessions need confirmation");
    expect(
      document.getElementById("sessions-to-confirm-banner-action"),
    ).toHaveTextContent("Review sessions");
    expect(
      document.getElementById("sessions-to-confirm-banner-description"),
    ).toHaveTextContent("Confirm it to keep student hours accurate.");
    expect(awaitingConfirmationHook).toHaveBeenCalledWith();

    await user.click(banner);
    const drawer = await screen.findByRole("dialog", {
      name: "Sessions to confirm",
    });
    expect(within(drawer).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(
      Array.from(drawer.querySelectorAll("li")).map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining("Oldest algebra"),
      expect.stringContaining("Morning geometry"),
      expect.stringContaining("Afternoon geometry"),
    ]);
    expect(screen.queryByText("Learner Ava Adams")).not.toBeInTheDocument();
  });

  it("hides initial loading, error, and zero states while retaining cached counts during refresh", () => {
    queryState.isLoading = true;
    const { rerender } = renderSessions();
    expect(
      screen.queryByRole("button", {
        name: /sessions? needs? confirmation Review sessions/,
      }),
    ).not.toBeInTheDocument();

    queryState.isLoading = false;
    queryState.isError = true;
    rerender(<SessionsToConfirm onCloseAutoFocus={vi.fn()} />);
    expect(
      screen.queryByRole("button", {
        name: /sessions? needs? confirmation Review sessions/,
      }),
    ).not.toBeInTheDocument();

    queryState.isError = false;
    setPages([page([], { total: 0 })], 0);
    rerender(<SessionsToConfirm onCloseAutoFocus={vi.fn()} />);
    expect(
      screen.queryByRole("button", {
        name: /sessions? needs? confirmation Review sessions/,
      }),
    ).not.toBeInTheDocument();

    setPages([page([makeSchedule()], { total: 4 })], 4);
    queryState.isLoading = true;
    rerender(<SessionsToConfirm onCloseAutoFocus={vi.fn()} />);
    expect(
      screen.getByRole("button", {
        name: "4 sessions need confirmation Review sessions",
      }),
    ).toBeVisible();

    queryState.isLoading = false;
    queryState.isError = true;
    rerender(<SessionsToConfirm onCloseAutoFocus={vi.fn()} />);
    expect(
      screen.getByRole("button", {
        name: "4 sessions need confirmation Review sessions",
      }),
    ).toBeVisible();
  });

  it("opens the responsive drawer and restores focus to the banner after Escape", async () => {
    const user = userEvent.setup();
    setPages([page([makeSchedule()], { total: 1 })], 1);
    renderSessions();

    const { banner, drawer } = await openDrawer(user);
    expect(banner).toHaveAttribute("aria-expanded", "true");
    expect(banner).toHaveAttribute("aria-controls", "sessions-to-confirm-drawer");
    expect(document.getElementById("sessions-to-confirm-drawer")).toBeTruthy();
    expect(drawer).toHaveClass("fixed", "inset-x-0", "md:inset-y-0");

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Sessions to confirm" })).not.toBeInTheDocument();
      expect(banner).toHaveFocus();
    });
  });

  it("uses the supplied fallback when the banner disappears before drawer close", async () => {
    const user = userEvent.setup();
    const fallback = vi.fn();
    setPages([page([makeSchedule()], { total: 1 })], 1);
    const { rerender } = renderSessions(fallback);

    await openDrawer(user);
    setPages([page([], { total: 0 })], 0);
    rerender(<SessionsToConfirm onCloseAutoFocus={fallback} />);
    expect(screen.getByRole("status")).toHaveTextContent("All caught up");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(fallback).toHaveBeenCalledTimes(1));
  });

  it("loads one page at the scroll threshold and retries a later-page error without losing rows", async () => {
    const user = userEvent.setup();
    let resolveNextPage: (() => void) | undefined;
    queryState.fetchNextPage.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveNextPage = resolve; }),
    );
    setPages(
      [page([makeSchedule({ className: "Visible first page" })], {
        hasNext: true,
        nextCursor: "cursor-2",
        total: 2,
      })],
      2,
    );
    queryState.hasNextPage = true;
    const { rerender } = renderSessions();
    const { drawer } = await openDrawer(user);
    const scrollport = within(drawer).getByRole("region", {
      name: "Sessions awaiting confirmation",
    });
    Object.defineProperties(scrollport, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 200 },
    });

    fireEvent.scroll(scrollport);
    fireEvent.scroll(scrollport);
    expect(queryState.fetchNextPage).toHaveBeenCalledTimes(1);
    await act(async () => { resolveNextPage?.(); });

    queryState.isFetchNextPageError = true;
    rerender(<SessionsToConfirm onCloseAutoFocus={vi.fn()} />);
    expect(screen.getByText("Visible first page")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load more sessions to confirm.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(queryState.fetchNextPage).toHaveBeenCalledTimes(2);
  });

  it("reconciles only successful Complete and No-show actions, then shows All caught up", async () => {
    const user = userEvent.setup();
    const complete = makeSchedule({ className: "Completion lesson", id: "complete" });
    const noShow = makeSchedule({ className: "No-show lesson", id: "no-show", time: 10 * 60 });
    setPages([page([complete, noShow], { total: 2 })], 2);
    renderSessions();
    const { drawer } = await openDrawer(user);

    await user.click(within(drawer).getByRole("button", {
      name: "Complete Completion lesson at 09:00 for 1 h",
    }));
    fireEvent.click(screen.getByText("Confirm complete failure"));
    expect(screen.getByText("Completion lesson")).toBeVisible();

    await user.click(within(drawer).getByRole("button", {
      name: "Complete Completion lesson at 09:00 for 1 h",
    }));
    fireEvent.click(screen.getByText("Confirm complete success"));
    await waitFor(() => expect(screen.queryByText("Completion lesson")).not.toBeInTheDocument());

    await user.click(within(drawer).getByRole("button", {
      name: "Mark No-show lesson at 10:00 for 1 h as no show",
    }));
    fireEvent.click(screen.getByText("Confirm no-show failure"));
    expect(screen.getByText("No-show lesson")).toBeVisible();

    await user.click(within(drawer).getByRole("button", {
      name: "Mark No-show lesson at 10:00 for 1 h as no show",
    }));
    fireEvent.click(screen.getByText("Confirm no-show success"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("All caught up"));
  });

  it("keeps a resolved session hidden after drawer close while the cached page is still stale", async () => {
    const user = userEvent.setup();
    const staleSchedule = makeSchedule({ className: "Stale cache lesson" });
    queryState.dataUpdatedAt = 1;
    setPages([page([staleSchedule], { total: 1 })], 1);
    const { rerender } = renderSessions();
    const { drawer } = await openDrawer(user);

    await user.click(within(drawer).getByRole("button", {
      name: "Complete Stale cache lesson at 09:00 for 1 h",
    }));
    fireEvent.click(screen.getByText("Confirm complete success"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("All caught up"));

    await user.click(within(drawer).getByRole("button", {
      name: "Close Sessions to confirm",
    }));
    await waitFor(() => expect(
      screen.queryByRole("dialog", { name: "Sessions to confirm" }),
    ).not.toBeInTheDocument());

    rerender(<SessionsToConfirm onCloseAutoFocus={vi.fn()} />);
    expect(queryState.data?.pages[0]?.schedules).toEqual([staleSchedule]);
    expect(screen.queryByText("Stale cache lesson")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "1 session needs confirmation Review sessions",
    })).not.toBeInTheDocument();
  });

  it("uses Thai banner, drawer, and action labels", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("th");
    setPages([page([makeSchedule()], { total: 1 })], 1);
    renderSessions();

    await user.click(screen.getByRole("button", {
      name: "มี 1 ช่วงเรียนที่ต้องยืนยัน ตรวจสอบช่วงเรียน",
    }));
    const drawer = await screen.findByRole("dialog", { name: "ช่วงเรียนที่ต้องยืนยัน" });
    expect(within(drawer).getByRole("button", {
      name: "บันทึก Algebra foundations เวลา 09:00 ระยะเวลา 1 ชม. ว่าเสร็จสิ้น",
    })).toBeVisible();
  });
});
