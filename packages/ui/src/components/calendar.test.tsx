import { render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Calendar } from "./calendar";

const MONTH = new Date(2026, 9, 1);
const START = new Date(2026, 9, 12);
const MIDDLE = new Date(2026, 9, 13);
const END = new Date(2026, 9, 18);

function markerFor(dateKey: string) {
  const button = document.querySelector<HTMLButtonElement>(
    `button[data-day="${dateKey}"]`,
  );

  if (!button) throw new Error(`Expected calendar day ${dateKey}.`);
  const marker = button.querySelector('[aria-hidden="true"]');

  if (!marker) throw new Error(`Expected indicator marker for ${dateKey}.`);
  return marker;
}

describe("Calendar teaching-scheduled modifier", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("adds an aria-hidden primary marker and full-date accessible label without marking unlisted days", () => {
    render(
      <Calendar
        month={MONTH}
        mode="single"
        selected={START}
        modifiers={{ teachingScheduled: [START] }}
      />,
    );

    const selected = screen.getByRole("button", {
      name: "Monday, October 12, 2026, selected, Has a lesson",
    });
    expect(selected).toHaveAttribute("data-day", "2026-10-12");
    expect(markerFor("2026-10-12")).toHaveClass("bg-primary-foreground");
    expect(document.querySelector('[data-day="2026-10-13"] [aria-hidden="true"]')).toBeNull();
  });

  it("uses foreground markers for selected week endpoints and primary for the muted week middle", () => {
    render(
      <Calendar
        month={MONTH}
        mode="range"
        selected={{ from: START, to: END }}
        modifiers={{ teachingScheduled: [START, MIDDLE, END] }}
      />,
    );

    expect(markerFor("2026-10-12")).toHaveClass("bg-primary-foreground");
    expect(markerFor("2026-10-13")).toHaveClass("bg-primary");
    expect(markerFor("2026-10-18")).toHaveClass("bg-primary-foreground");
  });

  it("uses the Thai scheduled-teaching phrase in the existing full-date label", async () => {
    await i18n.changeLanguage("th");
    render(
      <Calendar
        month={MONTH}
        mode="single"
        modifiers={{ teachingScheduled: [START] }}
      />,
    );

    expect(screen.getByRole("button", { name: /มีการสอน/ })).toHaveAttribute(
      "data-day",
      "2026-10-12",
    );
  });
});
