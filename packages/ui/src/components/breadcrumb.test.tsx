import { render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";
import {
  Breadcrumb,
  type BreadcrumbProps,
} from "./breadcrumb";
import i18n from "i18next";

const items = [
  { label: "Dashboard", to: "/" },
  { label: "Students", to: "/students" },
  { label: "Ada Lovelace" },
];

const itemsWithUnlinkedParent = [
  { label: "Dashboard", to: "/" },
  { label: "Students" },
  { label: "Ada Lovelace" },
];

function renderBreadcrumb(props: BreadcrumbProps) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const studentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "students",
    component: () => <Outlet />,
  });
  const studentRoute = createRoute({
    getParentRoute: () => studentsRoute,
    path: "$studentId",
    component: () => <Breadcrumb {...props} />,
  });
  const routeTree = rootRoute.addChildren([
    studentsRoute.addChildren([studentRoute]),
  ]);
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/students/ada-lovelace"] }),
    routeTree,
  });

  return render(<RouterProvider router={router} />);
}

describe("Breadcrumb", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders nothing for an empty trail", () => {
    const { container } = render(<Breadcrumb items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps a one-item trail as the current page without a back link", async () => {
    renderBreadcrumb({ items: [{ label: "Ada Lovelace" }] });

    const navigation = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });
    const trail = within(navigation).getByRole("list");

    expect(within(trail).getByText("Ada Lovelace")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(trail).not.toHaveClass("hidden", "md:flex");
    expect(
      navigation.querySelector('[data-slot="breadcrumb-back-link"]'),
    ).not.toBeInTheDocument();
  });

  it("renders linked ancestors, an accessible navigation label, and the current page", async () => {
    renderBreadcrumb({ items });

    const navigation = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });
    const trail = within(navigation).getByRole("list");

    expect(within(trail).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(within(trail).getByRole("link", { name: "Students" })).toHaveAttribute(
      "href",
      "/students",
    );
    expect(within(trail).getByText("Ada Lovelace")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("uses the responsive auto trail and parent back-link classes", async () => {
    renderBreadcrumb({ items });

    const navigation = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });
    const trail = within(navigation).getByRole("list");
    const backLink = navigation.querySelector(
      '[data-slot="breadcrumb-back-link"]',
    );

    expect(trail).toHaveClass("hidden", "md:flex");
    expect(backLink).toHaveClass("min-h-11", "min-w-11", "md:hidden");
    expect(backLink).toHaveAttribute("href", "/students");
  });

  it("uses the custom parent link at every width when collapsed always", async () => {
    renderBreadcrumb({
      backLabel: "All students",
      collapse: "always",
      items,
    });

    const navigation = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });
    const backLink = within(navigation).getByRole("link", {
      name: "All students",
    });

    expect(within(navigation).queryByRole("list")).not.toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/students");
    expect(backLink).toHaveClass("min-h-11", "min-w-11");
    expect(backLink).not.toHaveClass("md:hidden");
    expect(backLink).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-[3px]",
      "focus-visible:ring-ring/50",
    );
  });

  it("keeps the full trail and omits the back link when collapse is never", async () => {
    renderBreadcrumb({ collapse: "never", items });

    const navigation = await screen.findByRole("navigation", {
      name: "Breadcrumb",
    });
    const trail = within(navigation).getByRole("list");

    expect(trail).not.toHaveClass("hidden", "md:flex");
    expect(
      navigation.querySelector('[data-slot="breadcrumb-back-link"]'),
    ).not.toBeInTheDocument();
  });

  it.each(["auto", "always"] as const)(
    "keeps the full trail available without a mobile back affordance when its parent has no destination (%s)",
    async (collapse) => {
      renderBreadcrumb({ collapse, items: itemsWithUnlinkedParent });

      const navigation = await screen.findByRole("navigation", {
        name: "Breadcrumb",
      });
      const trail = within(navigation).getByRole("list");

      expect(trail).toHaveClass("flex");
      expect(trail).not.toHaveClass("hidden", "md:flex");
      expect(within(trail).getByText("Students")).toHaveAttribute(
        "data-slot",
        "breadcrumb-label",
      );
      expect(
        navigation.querySelector('[data-slot="breadcrumb-back-link"]'),
      ).not.toBeInTheDocument();
    },
  );
});
