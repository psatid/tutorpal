import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const searchState = vi.hoisted(() => ({
  value: {} as { error?: string; name?: string; success?: boolean | string; token?: string },
}));
const lineApi = vi.hoisted(() => ({ getV1LineAuthUrl: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => searchState.value,
}));

vi.mock("@/lib/api-client", () => ({ apiClient: lineApi }));

import { LineLinkScreen } from "@/screens/line-link-screen";

describe("LineLinkScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    searchState.value = {};
    lineApi.getV1LineAuthUrl.mockReset();
  });

  it("shows an optional linked identity after a successful LINE callback", () => {
    searchState.value = { success: true, name: "Mali's LINE" };
    render(<LineLinkScreen />);

    expect(screen.getByText(i18n.t("students:line.connectedAs", { name: "Mali's LINE" }))).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("students:line.retry") })).not.toBeInTheDocument();
  });

  it("keeps a failed authorization retryable only for a network failure", async () => {
    const user = userEvent.setup();
    searchState.value = { token: "valid-link-token" };
    lineApi.getV1LineAuthUrl.mockRejectedValue(
      new AxiosError("offline", AxiosError.ERR_NETWORK),
    );
    render(<LineLinkScreen />);

    await user.click(screen.getByRole("button", { name: i18n.t("students:line.connect") }));
    const retry = await screen.findByRole("button", { name: i18n.t("students:line.retry") });
    expect(screen.getByRole("alert")).toHaveTextContent(i18n.t("students:line.error.network"));

    await user.click(retry);
    await waitFor(() => expect(lineApi.getV1LineAuthUrl).toHaveBeenCalledTimes(2));
    expect(lineApi.getV1LineAuthUrl).toHaveBeenLastCalledWith({ token: "valid-link-token" });
  });

  it.each([
    [undefined, "missing callback token"],
    ["INVALID_TOKEN", "expired callback token"],
    ["MISSING_TOKEN", "missing backend token"],
  ])("treats %s as terminal (%s)", async (errorCode, _description) => {
    if (errorCode) {
      searchState.value = { token: "expired-link-token" };
      const error = new AxiosError("request failed", AxiosError.ERR_BAD_REQUEST);
      Object.assign(error, { response: { data: { errorCode }, status: 400 } });
      lineApi.getV1LineAuthUrl.mockRejectedValue(error);
    }

    const user = userEvent.setup();
    render(<LineLinkScreen />);

    if (errorCode) {
      await user.click(screen.getByRole("button", { name: i18n.t("students:line.connect") }));
    }

    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("students:line.error.invalid"));
    expect(screen.getByText(i18n.t("students:line.askTutor"))).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("students:line.retry") })).not.toBeInTheDocument();
  });

  it.each([
    ["LINE_CONNECTION_REQUIRED", "LINE application failure"],
    ["SOMETHING_ELSE", "unknown HTTP application failure"],
  ])("does not retry a %s (%s)", async (errorCode, _description) => {
    const user = userEvent.setup();
    searchState.value = { token: "server-error-token" };
    const error = new AxiosError("request failed", AxiosError.ERR_BAD_REQUEST);
    Object.assign(error, { response: { data: { errorCode }, status: 400 } });
    lineApi.getV1LineAuthUrl.mockRejectedValue(error);
    render(<LineLinkScreen />);

    await user.click(screen.getByRole("button", { name: i18n.t("students:line.connect") }));

    await screen.findByRole("alert");
    expect(screen.getByText(i18n.t("students:line.askTutor"))).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("students:line.retry") })).not.toBeInTheDocument();
  });

  it("does not retry an unsafe authorization URL", async () => {
    const user = userEvent.setup();
    searchState.value = { token: "unsafe-url-token" };
    lineApi.getV1LineAuthUrl.mockResolvedValue({
      data: { authUrl: "https://attacker.example.test/authorize" },
    });
    render(<LineLinkScreen />);

    await user.click(screen.getByRole("button", { name: i18n.t("students:line.connect") }));

    await screen.findByRole("alert");
    expect(screen.getByText(i18n.t("students:line.askTutor"))).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("students:line.retry") })).not.toBeInTheDocument();
  });
});
