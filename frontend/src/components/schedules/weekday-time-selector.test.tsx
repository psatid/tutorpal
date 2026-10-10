import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useWatch } from "react-hook-form";
import { beforeEach, describe, expect, it } from "vitest";
import { WeekdayTimeSelector } from "@/components/schedules/weekday-time-selector";
import i18n from "@/lib/i18n/config";
import type { ScheduleFormData } from "@/types/schedule";

type FixtureProps = {
  scheduleItems?: NonNullable<ScheduleFormData["recurring"]>["scheduleItems"];
};

function WeekdaySelectorFixture({ scheduleItems = [] }: FixtureProps) {
  const form = useForm<ScheduleFormData>({
    defaultValues: {
      recurring: { scheduleItems },
    },
  });
  const values = useWatch({ control: form.control, name: "recurring.scheduleItems" });

  return (
    <>
      <WeekdayTimeSelector control={form.control} name="recurring.scheduleItems" />
      <output data-testid="schedule-items">{JSON.stringify(values)}</output>
    </>
  );
}

function getScheduleItems() {
  return JSON.parse(screen.getByTestId("schedule-items").textContent ?? "[]") as NonNullable<
    ScheduleFormData["recurring"]
  >["scheduleItems"];
}

describe("WeekdayTimeSelector", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("creates, extends, and clears a weekday's repeated intervals", async () => {
    const user = userEvent.setup();
    render(<WeekdaySelectorFixture />);

    await user.click(screen.getByRole("checkbox", { name: "Monday" }));
    expect(getScheduleItems()).toEqual([
      { weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
    ]);

    await user.click(screen.getByRole("button", { name: "Add a session on Monday" }));
    expect(getScheduleItems()).toEqual([
      { weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
      { weekday: "MONDAY", time: "10:00", durationMinutes: 60 },
    ]);

    await user.click(
      screen.getByRole("button", { name: "Remove session 2 on Monday" }),
    );
    expect(getScheduleItems()).toEqual([
      { weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
    ]);

    await user.click(screen.getByRole("checkbox", { name: "Monday" }));
    expect(getScheduleItems()).toEqual([]);
  });

  it("keeps focus on a weekday checkbox after revealing its session fields", async () => {
    const user = userEvent.setup();
    render(<WeekdaySelectorFixture />);

    const monday = screen.getByRole("checkbox", { name: "Monday" });
    await user.click(monday);

    expect(monday).toHaveFocus();
    expect(
      screen.getByLabelText("Time — Monday, session 1"),
    ).toBeInTheDocument();
  });

  it("keeps focus on Select All after revealing every weekday's session fields", async () => {
    const user = userEvent.setup();
    render(<WeekdaySelectorFixture />);

    const selectAll = screen.getByRole("button", { name: "Select All" });
    await user.click(selectAll);

    expect(screen.getByRole("button", { name: "Clear All" })).toHaveFocus();
    expect(getScheduleItems()).toHaveLength(7);
    expect(
      screen.getByLabelText("Time — Sunday, session 1"),
    ).toBeInTheDocument();
  });

  it("groups existing repeated weekday intervals chronologically", () => {
    render(
      <WeekdaySelectorFixture
        scheduleItems={[
          { weekday: "MONDAY", time: "14:00", durationMinutes: 30 },
          { weekday: "TUESDAY", time: "09:00", durationMinutes: 60 },
          { weekday: "MONDAY", time: "08:00", durationMinutes: 60 },
        ]}
      />,
    );

    const mondayCard = screen
      .getByRole("checkbox", { name: "Monday" })
      .closest(".rounded-xl");
    expect(mondayCard).not.toBeNull();
    expect(within(mondayCard as HTMLElement).getAllByText(/Session [12]/)).toHaveLength(2);

    const mondayTimes = [
      within(mondayCard as HTMLElement).getByLabelText(
        "Time — Monday, session 1",
      ),
      within(mondayCard as HTMLElement).getByLabelText(
        "Time — Monday, session 2",
      ),
    ].map((input) => (input as HTMLInputElement).value);
    expect(mondayTimes).toEqual(["08:00", "14:00"]);
  });

  it("marks each overlapping global interval control invalid with a slot-specific label", () => {
    render(
      <WeekdaySelectorFixture
        scheduleItems={[
          { weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
          { weekday: "MONDAY", time: "09:30", durationMinutes: 60 },
        ]}
      />,
    );

	expect(screen.getByRole("alert")).toHaveTextContent("Recurring sessions cannot overlap");
    const firstTime = screen.getByLabelText("Time — Monday, session 1");
    const secondTime = screen.getByLabelText("Time — Monday, session 2");
    expect(firstTime).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(secondTime).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(firstTime).toHaveClass("aria-invalid:border-destructive");
    expect(
      screen.getByRole("combobox", {
        name: "Duration — Monday, session 1",
      }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("combobox", {
        name: "Duration — Monday, session 2",
      }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("disables Add session at midnight and explains why", () => {
    render(
      <WeekdaySelectorFixture
        scheduleItems={[
          { weekday: "MONDAY", time: "23:00", durationMinutes: 60 },
        ]}
      />,
    );

    const addSession = screen.getByRole("button", {
      name: "Add a session on Monday",
    });
    expect(addSession).toBeDisabled();
    const explanationId = addSession.getAttribute("aria-describedby");
    expect(explanationId).toBe("weekday-monday-limit");
    expect(document.getElementById(explanationId!)).toHaveTextContent(
      "No later start time is available on Monday.",
    );
  });
});
