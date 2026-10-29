import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const connectionState = vi.hoisted(() => ({
  data: undefined as
    | {
        accountBasicId?: string | null;
        accountName?: string;
        configured: boolean;
        testRecipientConnected: boolean;
      }
    | undefined,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
}));

vi.mock("@/hooks/queries/use-line-connection", () => ({
  useLineConnection: () => connectionState,
}));

import { IntegrationsScreen } from "@/screens/integrations-screen";

function renderIntegrations() {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const integrationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "integrations",
    component: () => <Outlet />,
  });
  const integrationsIndexRoute = createRoute({
    getParentRoute: () => integrationsRoute,
    path: "/",
    component: IntegrationsScreen,
  });
  const lineRoute = createRoute({
    getParentRoute: () => integrationsRoute,
    path: "line",
    component: () => <h1>LINE integration destination</h1>,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/integrations"] }),
    routeTree: rootRoute.addChildren([
      integrationsRoute.addChildren([integrationsIndexRoute, lineRoute]),
    ]),
  });

  return render(<RouterProvider router={router} />);
}

async function getIntegrationCard(name: string) {
  const heading = await screen.findByRole("heading", { name });
  const card = heading.closest("article");

  if (!card) {
    throw new Error(`Expected ${name} to be inside an integration card.`);
  }

  return card;
}

describe("IntegrationsScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.stubGlobal("scrollTo", vi.fn());
    connectionState.data = undefined;
    connectionState.isError = false;
    connectionState.isLoading = false;
    connectionState.refetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an accessible LINE loading placeholder while its connection state loads", async () => {
    connectionState.isLoading = true;
    renderIntegrations();

    const loadingCard = await screen.findByRole("status", {
      name: "Loading LINE integration",
    });

    expect(loadingCard).toHaveAttribute("aria-busy", "true");
    expect(loadingCard).toHaveClass("flex-col", "sm:flex-row");
    expect(loadingCard.firstElementChild).toHaveClass("flex", "flex-1");
    expect(loadingCard.lastElementChild).toHaveClass("h-11", "w-full", "sm:w-28");
    expect(screen.queryByRole("link", { name: /LINE/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Zoom" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Google Meet" })).toBeVisible();
  });

  it("shows the query error and retries it through keyboard activation", async () => {
    const user = userEvent.setup();
    connectionState.isError = true;
    renderIntegrations();

    const alert = await screen.findByRole("alert");
    const lineCard = alert.closest("article");

    if (!lineCard) {
      throw new Error("Expected the LINE error to remain inside its integration card.");
    }

    expect(alert).toHaveTextContent(
      "We couldn't check your LINE connection. Try again.",
    );
    expect(within(lineCard).getByRole("heading", { name: "LINE" })).toBeVisible();
    const providerMark = within(lineCard).getByAltText("");
    expect(providerMark).toHaveAttribute("src", "/icons/line/default.svg");
    expect(providerMark.closest('[aria-hidden="true"]')).not.toBeNull();

    const retry = within(lineCard).getByRole("button", { name: "Retry" });
    expect(lineCard).toHaveClass("flex-col", "sm:flex-row");
    expect(lineCard.lastElementChild).toHaveClass("w-full", "sm:w-auto");
    retry.focus();
    await user.keyboard("{Enter}");

    expect(connectionState.refetch).toHaveBeenCalledTimes(1);
  });

  it("renders an unconfigured LINE status and routes its setup action to the LINE integration", async () => {
    const user = userEvent.setup();
    connectionState.data = {
      configured: false,
      testRecipientConnected: false,
    };
    renderIntegrations();

    const lineCard = await screen.findByRole("heading", { name: "LINE" });
    expect(within(lineCard.closest("article")!).getByText("Not connected")).toBeVisible();

    const setup = screen.getByRole("link", { name: "Set up LINE" });
    expect(setup).toHaveAttribute("href", "/integrations/line");
    expect(setup).toHaveClass("min-h-11", "w-full", "sm:w-auto");
    expect(lineCard.closest("article")).toHaveClass("flex-col", "sm:flex-row");

    setup.focus();
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", { name: "LINE integration destination" }),
    ).toBeVisible();
  });

  it("renders a configured LINE status and routes management to the same destination", async () => {
    connectionState.data = {
      accountBasicId: "@tutorpal",
      accountName: "TutorPal Academy",
      configured: true,
      testRecipientConnected: true,
    };
    renderIntegrations();

    const lineCard = await getIntegrationCard("LINE");
    expect(within(lineCard).getByText("Connected")).toBeVisible();
    expect(within(lineCard).getByText("TutorPal Academy")).toBeVisible();
    expect(within(lineCard).getByText("@tutorpal")).toBeVisible();
    expect(within(lineCard).getByRole("link", { name: "Manage" })).toHaveAttribute(
      "href",
      "/integrations/line",
    );
  });

  it("uses the same responsive card shell for every provider", async () => {
    connectionState.data = {
      configured: false,
      testRecipientConnected: false,
    };
    renderIntegrations();

    expect(
      screen.queryByText(
        "Your connection details are encrypted and used only for your teaching workspace.",
      ),
    ).not.toBeInTheDocument();

    for (const provider of ["LINE", "Zoom", "Google Meet"]) {
      const card = await getIntegrationCard(provider);
      const heading = within(card).getByRole("heading", { name: provider });
      const content = card.firstElementChild;
      const providerMark = within(card).getByAltText("").closest("span");
      const nameRow = heading.parentElement;
      const badge = within(card).getByText(
        provider === "LINE" ? "Not connected" : "Coming soon",
      );

      expect(card).toHaveClass(
        "flex",
        "min-w-0",
        "flex-col",
        "gap-5",
        "sm:flex-row",
        "sm:items-center",
      );
      expect(content).toHaveClass("flex", "min-w-0", "flex-1", "items-start");
      expect(providerMark).toHaveClass("size-12", "shrink-0");
      expect(content).toContainElement(providerMark);
      expect(content).toContainElement(heading);
      expect(nameRow).toHaveClass("flex", "flex-wrap", "items-center", "gap-2");
      expect(
        within(card).getByText(
          provider === "LINE"
            ? "Message students from your LINE Official Account."
            : "Create and manage online class meetings.",
        ),
      ).not.toHaveClass("truncate");
      expect(nameRow).toContainElement(badge);
      expect(badge.parentElement).not.toHaveClass("ml-auto");
    }

    const lineCard = await getIntegrationCard("LINE");
    const setup = within(lineCard).getByRole("link", { name: "Set up LINE" });

    expect(lineCard.lastElementChild).toHaveClass("w-full", "shrink-0", "sm:w-auto");
    expect(lineCard.lastElementChild).toContainElement(setup);
    expect(setup).toHaveClass("w-full", "sm:w-auto");
  });

  it("keeps unavailable providers visible but noninteractive", async () => {
    renderIntegrations();

    for (const provider of ["Zoom", "Google Meet"]) {
      const card = await getIntegrationCard(provider);
      const comingSoonBadge = within(card)
        .getByText("Coming soon")
        .closest('[data-slot="badge"]');

      if (!comingSoonBadge) {
        throw new Error(`Expected ${provider} to render a Coming soon badge.`);
      }

      expect(comingSoonBadge).toHaveTextContent("Coming soon");
      expect(comingSoonBadge.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(within(card).queryByRole("link")).not.toBeInTheDocument();
      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
    }
  });
});
