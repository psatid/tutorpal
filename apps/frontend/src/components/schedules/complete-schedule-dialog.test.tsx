import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, useRef, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import { Schedule, type ScheduleDisplayInput } from "@/models/schedule";

const completeMutation = vi.hoisted(() => ({
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
  useCompleteSchedule: () => completeMutation,
}));

import { CompleteScheduleDialog } from "@/components/schedules/complete-schedule-dialog";

function makeSchedule(
  overrides: Partial<ScheduleDisplayInput> = {},
): Schedule {
  return Schedule.fromInput({
    className: "Class one",
    date: "2026-10-08",
    durationMinutes: 90,
    id: "schedule-1",
    time: 540,
    type: "ONLINE",
    ...overrides,
  });
}

const schedule = makeSchedule();

type DialogProps = Pick<
  ComponentProps<typeof CompleteScheduleDialog>,
  "finalFocus" | "onOpenChange" | "onSuccess" | "schedule"
>;

function renderDialog(overrides: Partial<DialogProps> = {}) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const onSuccess = overrides.onSuccess ?? vi.fn();

  const view = render(
    <CompleteScheduleDialog
      finalFocus={overrides.finalFocus}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      schedule={overrides.schedule ?? schedule}
    />,
  );

  return { ...view, onOpenChange, onSuccess };
}

function FocusReturnHarness() {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(
    schedule,
  );
  const finalFocus = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={finalFocus} type="button">
        Return to schedules
      </button>
      <CompleteScheduleDialog
        finalFocus={finalFocus}
        onOpenChange={(open) => {
          if (!open) setActiveSchedule(null);
        }}
        schedule={activeSchedule}
      />
    </>
  );
}

describe("CompleteScheduleDialog", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    completeMutation.error = null;
    completeMutation.isError = false;
    completeMutation.isPending = false;
    completeMutation.mutateAsync.mockReset();
    completeMutation.mutateAsync.mockResolvedValue(undefined);
    completeMutation.reset.mockReset();
  });

  it("uses plural hours for a fractional schedule and mutates only after explicit confirmation", async () => {
    const user = userEvent.setup();
    const callbackOrder: string[] = [];
    const onSuccess = vi.fn(() => callbackOrder.push("success"));
    const onOpenChange = vi.fn((open: boolean) => {
      if (!open) callbackOrder.push("close");
    });
    renderDialog({ onOpenChange, onSuccess });

    const dialog = screen.getByRole("alertdialog", {
      name: "Complete this schedule?",
    });
    expect(dialog).toHaveClass("w-[calc(100%-2rem)]", "sm:w-full");
    expect(
      screen.getByText(
        "This schedule will be marked as completed and 1.5 hours will be deducted.",
      ),
    ).toBeVisible();
    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(completeMutation.mutateAsync).toHaveBeenCalledWith("schedule-1");
    });
    expect(onSuccess).toHaveBeenCalledWith(schedule);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(callbackOrder).toEqual(["success", "close"]);
  });

  it("uses singular hour copy for a one-hour schedule", () => {
    renderDialog({ schedule: makeSchedule({ durationMinutes: 60 }) });

    expect(
      screen.getByText(
        "This schedule will be marked as completed and 1 hour will be deducted.",
      ),
    ).toBeVisible();
  });

  it("cancels with either Cancel or Escape without mutating", async () => {
    const user = userEvent.setup();
    const cancelled = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(cancelled.onOpenChange).toHaveBeenCalledWith(false);
    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();

    cancelled.unmount();

    const escaped = renderDialog();
    await user.keyboard("{Escape}");

    expect(escaped.onOpenChange).toHaveBeenCalledWith(false);
    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("returns focus to the supplied stable target after cancellation", async () => {
    const user = userEvent.setup();
    render(<FocusReturnHarness />);

    const cancel = screen.getByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());
    await user.click(cancel);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Return to schedules" }),
      ).toHaveFocus(),
    );
  });

  it("prevents dismissal and duplicate confirmation while pending", async () => {
    const user = userEvent.setup();
    let resolveMutation: (() => void) | undefined;
    completeMutation.mutateAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    );
    const { onOpenChange, rerender } = renderDialog();

    const confirm = screen.getByRole("button", { name: "Complete" });
    await user.click(confirm);
    await user.click(confirm);

    expect(completeMutation.mutateAsync).toHaveBeenCalledTimes(1);

    completeMutation.isPending = true;
    rerender(
      <CompleteScheduleDialog
        onOpenChange={onOpenChange}
        schedule={schedule}
      />,
    );

    expect(screen.getByRole("alertdialog")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Complete" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Complete" })).toBeDisabled();

    await user.keyboard("{Escape}");

    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    completeMutation.isPending = false;
    await act(async () => {
      resolveMutation?.();
    });
  });

  it("keeps a localized error inline and allows a retry", async () => {
    const user = userEvent.setup();
    const rawError = new Error("The raw service error must stay hidden.");
    completeMutation.mutateAsync.mockRejectedValueOnce(rawError);
    const { rerender } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(completeMutation.mutateAsync).toHaveBeenCalledTimes(1);
    });

    completeMutation.error = rawError;
    completeMutation.isError = true;
    rerender(
      <CompleteScheduleDialog onOpenChange={vi.fn()} schedule={schedule} />,
    );

    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to complete schedule. Please try again.",
    );
    expect(
      screen.queryByText("The raw service error must stay hidden."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Complete" }));

    expect(completeMutation.mutateAsync).toHaveBeenCalledTimes(2);
  });
});
