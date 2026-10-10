import { render, screen } from "@testing-library/react";
import { ArrowRight, Plus } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("replaces loading content with three dots while preserving its accessible label and width placeholder", () => {
    render(
      <Button loading leftIcon={Plus} rightIcon={ArrowRight}>
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
      <Button leftIcon={Plus} rightIcon={ArrowRight}>
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
});
