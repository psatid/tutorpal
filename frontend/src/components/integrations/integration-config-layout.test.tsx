import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} href={to}>
      {children}
    </a>
  ),
}));

import { IntegrationConfigLayout } from "@/components/integrations/integration-config-layout";

function renderLayout(contentWidth = 1040) {
  return render(
    <main>
      <div data-testid="layout-parent" style={{ width: contentWidth }}>
        <IntegrationConfigLayout
          aside={<p>Supporting content</p>}
          badgeLabel="Supported"
          description="Configure your provider connection."
          mobileParentLabel="All integrations"
          parentLabel="Integrations"
          parentTo="/integrations"
          providerMark={<img alt="" src="/icons/line/default.svg" />}
          title="LINE"
        >
          <p>Primary content</p>
        </IntegrationConfigLayout>
      </div>
    </main>,
  );
}

function getLayoutElements() {
  const layout = screen.getByRole("heading", { name: "LINE" }).closest("section");
  const aside = screen.getByText("Supporting content").closest("aside");

  if (!layout || !aside || !aside.parentElement) {
    throw new Error("Expected the integration configuration layout structure.");
  }

  return { aside, contentGrid: aside.parentElement, layout };
}

describe("IntegrationConfigLayout", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("keeps a single main landmark when the route supplies the outer main", () => {
    const { container } = renderLayout();

    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    const outerMain = mains[0];
    if (!outerMain) {
      throw new Error("Expected the route to provide a main landmark.");
    }

    expect(outerMain).toBe(container.querySelector("main"));
    expect(outerMain.querySelector("main")).toBeNull();
  });

  it.each([
    { contentWidth: 288, viewportWidth: 320 },
    { contentWidth: 358, viewportWidth: 390 },
    { contentWidth: 736, viewportWidth: 768 },
    { contentWidth: 768, viewportWidth: 1024 },
    { contentWidth: 823, viewportWidth: 1024 },
    { contentWidth: 824, viewportWidth: 1024 },
    { contentWidth: 960, viewportWidth: 1024 },
  ])(
    "declares the 824px content-container split contract at a $viewportWidthpx viewport with $contentWidthpx available",
    ({ contentWidth }) => {
      renderLayout(contentWidth);

      const { aside, contentGrid, layout } = getLayoutElements();
      const gridColumnsClass = "@[824px]:grid-cols-[minmax(0,32.5rem)_minmax(0,1fr)]";

      expect(layout).toHaveClass("@container", "w-full", "max-w-[1040px]");
      expect(contentGrid).toHaveClass("grid", "min-w-0", "gap-6", gridColumnsClass);
      expect(contentGrid.classList).not.toContain(
        "grid-cols-[minmax(0,32.5rem)_minmax(0,1fr)]",
      );
      expect(contentGrid.className).not.toMatch(/\b(?:sm|md|lg):grid-cols-/);
      expect(aside).toHaveClass(
        "min-w-0",
        "@[824px]:w-[17.5rem]",
        "@[824px]:justify-self-end",
      );
    },
  );
});
