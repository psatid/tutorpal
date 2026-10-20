import { render, screen } from "@testing-library/react";
import {
  ArrowRight01Icon as ArrowRightHugeIcon,
  Add01Icon as PlusHugeIcon,
} from "@hugeicons/core-free-icons";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/common/button";

describe("Button", () => {
  it("replaces loading content with three dots while preserving its accessible label and width placeholder", () => {
    render(
      <Button loading leftIcon={PlusHugeIcon} rightIcon={ArrowRightHugeIcon}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });
    const placeholder = button.querySelector(".button-loading-placeholder");
    const dots = button.querySelector(".button-loading-dots");

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveTextContent("Save changes");
    expect(placeholder?.querySelectorAll("svg")).toHaveLength(2);
    expect(dots).toHaveAttribute("aria-hidden", "true");
    expect(dots?.querySelectorAll(".button-loading-dot")).toHaveLength(3);
    expect(button.querySelector(".sr-only")).toHaveTextContent("Save changes");
  });

  it("keeps its normal label and icons when it is not loading", () => {
    render(
      <Button leftIcon={PlusHugeIcon} rightIcon={ArrowRightHugeIcon}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save changes" });

    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toHaveAttribute("data-loading");
    expect(button).toHaveTextContent("Save changes");
    expect(button.querySelectorAll("svg")).toHaveLength(2);
    expect(button.querySelector(".button-loading-placeholder")).not.toBeInTheDocument();
    expect(button.querySelector(".button-loading-dots")).not.toBeInTheDocument();
  });

  it.each([
    ["xs", "h-6", "gap-1"],
    ["sm", "h-8", "gap-1"],
    ["md", "h-11", "gap-1.5"],
    ["lg", "h-11", "gap-1.5"],
  ] as const)(
    "keeps the %s link height and gap while removing padding for buttons and anchors",
    (size, height, gap) => {
      render(
        <>
          <Button size={size} variant="link">
            Button link
          </Button>
          <a className={buttonVariants({ size, variant: "link" })} href="/schedule">
            Anchor link
          </a>
        </>,
      );

      for (const control of [
        screen.getByRole("button", { name: "Button link" }),
        screen.getByRole("link", { name: "Anchor link" }),
      ]) {
        expect(control).toHaveClass("p-0!", height, gap);
      }
    },
  );
});
