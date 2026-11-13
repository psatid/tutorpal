import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResponsiveDrawer } from "./responsive-drawer";

const originalVisualViewport = Object.getOwnPropertyDescriptor(
  window,
  "visualViewport",
);
const originalInnerHeight = Object.getOwnPropertyDescriptor(
  window,
  "innerHeight",
);

type VisualViewportListener = (event: Event) => void;

function mockViewport({
  desktop = false,
  height = 700,
  offsetTop = 10,
}: {
  desktop?: boolean;
  height?: number;
  offsetTop?: number;
} = {}) {
  const listeners = new Map<string, VisualViewportListener>();
  const visualViewport = {
    height,
    offsetTop,
    addEventListener: (type: string, listener: VisualViewportListener) => {
      listeners.set(type, listener);
    },
    removeEventListener: (type: string) => {
      listeners.delete(type);
    },
  };

  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: query === "(min-width: 768px)" && desktop,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: visualViewport,
  });

  return {
    resize(next: { height: number; offsetTop: number }) {
      visualViewport.height = next.height;
      visualViewport.offsetTop = next.offsetTop;
      act(() => listeners.get("resize")?.(new Event("resize")));
    },
  };
}

function renderDrawer() {
  return render(
    <ResponsiveDrawer
      onOpenChange={vi.fn()}
      open
      title="Viewport-sized drawer"
      useVisualViewportSizing
    >
      <div>Drawer content</div>
    </ResponsiveDrawer>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  if (originalInnerHeight) {
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  }
  if (originalVisualViewport) {
    Object.defineProperty(window, "visualViewport", originalVisualViewport);
  } else {
    Reflect.deleteProperty(window, "visualViewport");
  }
});

describe("ResponsiveDrawer visual viewport sizing", () => {
  it("keeps the 85dvh cap while responding to visual viewport changes on mobile", async () => {
    const viewport = mockViewport();
    renderDrawer();

    const popup = await screen.findByRole("dialog", {
      name: "Viewport-sized drawer",
    });
    await waitFor(() => {
      expect(popup.style.height).toContain("85dvh");
      expect(popup.style.height).toContain("700px");
      expect(popup.style.height).toContain("44rem");
      expect(popup.style.maxHeight).toContain("85dvh");
      expect(popup.style.maxHeight).toContain("700px");
      expect(popup.style.maxHeight).toContain("44rem");
      expect(popup.style.bottom).toBe("90px");
    });

    viewport.resize({ height: 600, offsetTop: 20 });

    await waitFor(() => {
      expect(popup.style.height).toContain("600px");
      expect(popup.style.maxHeight).toContain("600px");
      expect(popup.style.bottom).toBe("180px");
      expect(popup.style.maxHeight).toContain("85dvh");
    });
  });

  it("does not apply viewport sizing to a desktop drawer", async () => {
    mockViewport({ desktop: true });
    renderDrawer();

    const popup = await screen.findByRole("dialog", {
      name: "Viewport-sized drawer",
    });

    expect(popup).not.toHaveStyle({
      height: expect.stringContaining("85dvh"),
      maxHeight: expect.stringContaining("85dvh"),
    });
    expect(popup.style.height).toBe("");
    expect(popup.style.maxHeight).toBe("");
    expect(popup.style.bottom).toBe("");
  });
});
