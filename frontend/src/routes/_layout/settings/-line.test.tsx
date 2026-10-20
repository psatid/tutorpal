import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { Route } from "@/routes/_layout/settings/line";

function getValidatedSearch(search: Record<string, unknown>) {
  const validateSearch = Route.options.validateSearch;

  if (!validateSearch) {
    throw new Error("Expected the legacy LINE settings route to validate its search.");
  }

  if (typeof validateSearch === "function") {
    return validateSearch(search);
  }

  if ("parse" in validateSearch && typeof validateSearch.parse === "function") {
    return validateSearch.parse(search);
  }

  throw new Error("Expected the legacy LINE settings search validator to be callable.");
}

function getRedirect(search: Record<string, unknown>) {
  const beforeLoad = Route.options.beforeLoad;

  if (!beforeLoad) {
    throw new Error("Expected the legacy LINE settings route to redirect.");
  }

  try {
    beforeLoad({ search } as never);
  } catch (error) {
    return error;
  }

  throw new Error("Expected the legacy LINE settings route to throw a redirect.");
}

describe("legacy /settings/line callback route", () => {
  it("accepts stale callback parameters and redirects them to the integrations route", () => {
    const search = getValidatedSearch({ testRecipient: "connected" });
    const redirect = getRedirect(search);

    expect(isRedirect(redirect)).toBe(true);
    expect(redirect).toMatchObject({
      options: {
        replace: true,
        search: { testRecipient: "connected" },
        to: "/integrations/line",
      },
    });
  });

  it("tolerates an obsolete callback value instead of rejecting the legacy URL", () => {
    const search = getValidatedSearch({ testRecipient: "obsolete" });
    const redirect = getRedirect(search);

    expect(search).toEqual({ testRecipient: undefined });
    expect(isRedirect(redirect)).toBe(true);
    expect(redirect).toMatchObject({
      options: {
        replace: true,
        search: { testRecipient: undefined },
        to: "/integrations/line",
      },
    });
  });
});
