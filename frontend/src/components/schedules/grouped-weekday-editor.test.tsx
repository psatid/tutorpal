import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupedWeekdayEditor } from "@/components/schedules/grouped-weekday-editor";
import i18n from "@/lib/i18n/config";

describe("GroupedWeekdayEditor", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("announces overlapping weekday sessions in English and links each interval to the feedback", async () => {
    const renderInterval = vi.fn(({ item, overlapDescriptionId }) => (
      <input aria-describedby={overlapDescriptionId} aria-label={`Time ${item.id}`} />
    ));

    render(
      <GroupedWeekdayEditor
        items={[
          { id: "first", index: 0, weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
          { id: "second", index: 1, weekday: "MONDAY", time: "09:30", durationMinutes: 60 },
        ]}
        onAddInterval={vi.fn()}
        onRemoveInterval={vi.fn()}
        onSelectAll={vi.fn()}
        onToggleWeekday={vi.fn()}
        renderInterval={renderInterval}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
		"Recurring sessions cannot overlap.",
    );
    expect(screen.getByLabelText("Time first")).toHaveAttribute(
      "aria-describedby",
      alert.id,
    );
    expect(screen.getByLabelText("Time second")).toHaveAttribute(
      "aria-describedby",
      alert.id,
    );
  });

  it("shows the Thai inline overlap feedback", async () => {
    await i18n.changeLanguage("th");

    render(
      <GroupedWeekdayEditor
        items={[
          { id: "first", index: 0, weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
          { id: "second", index: 1, weekday: "MONDAY", time: "09:30", durationMinutes: 60 },
        ]}
        onAddInterval={vi.fn()}
        onRemoveInterval={vi.fn()}
        onSelectAll={vi.fn()}
        onToggleWeekday={vi.fn()}
        renderInterval={() => null}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
		"ช่วงเรียนที่เกิดซ้ำต้องไม่ทับซ้อนกัน",
    );
  });
});
