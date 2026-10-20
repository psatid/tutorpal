import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const navigate = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));
const connectionState = vi.hoisted(() => ({
  data: {
    configured: true,
    testRecipientConnected: false,
  },
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/queries/use-line-connection", () => ({
  useLineConnection: () => connectionState,
}));

vi.mock("sonner", () => ({ toast }));

import { LineSettingsScreen } from "@/screens/line-settings-screen";

function renderLineSettings(testRecipient?: "connected" | "error") {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LineSettingsScreen testRecipient={testRecipient} />
    </QueryClientProvider>,
  );
}

describe("LineSettingsScreen callback handling", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    navigate.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();
    connectionState.data = {
      configured: true,
      testRecipientConnected: false,
    };
    connectionState.isError = false;
    connectionState.isLoading = false;
    connectionState.refetch.mockReset();
  });

  it("cleans a successful callback URL, refetches LINE status, and confirms the verified recipient", async () => {
    connectionState.refetch.mockResolvedValue({
      data: {
        configured: true,
        testRecipientConnected: true,
      },
      isError: false,
    });

    renderLineSettings("connected");

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        replace: true,
        search: {},
        to: "/integrations/line",
      });
      expect(connectionState.refetch).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        "Your test LINE account is connected.",
      );
    });
  });

  it("keeps the callback URL clean and reports a refetch result without a verified recipient", async () => {
    connectionState.refetch.mockResolvedValue({
      data: {
        configured: true,
        testRecipientConnected: false,
      },
      isError: false,
    });

    renderLineSettings("connected");

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        replace: true,
        search: {},
        to: "/integrations/line",
      });
      expect(connectionState.refetch).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "We couldn't connect that test account. Make sure you added your Official Account as a friend.",
      );
    });
  });

  it("cleans an error callback URL and reports its failure without refreshing the connection", async () => {
    renderLineSettings("error");

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        replace: true,
        search: {},
        to: "/integrations/line",
      });
      expect(toast.error).toHaveBeenCalledWith(
        "We couldn't connect that test account. Make sure you added your Official Account as a friend.",
      );
    });
    expect(connectionState.refetch).not.toHaveBeenCalled();
  });

  it("keeps normal connection content accessible while callback confirmation resolves", () => {
    connectionState.refetch.mockResolvedValue({
      data: connectionState.data,
      isError: false,
    });
    renderLineSettings("connected");

    expect(screen.getByRole("status")).toHaveTextContent("Connected");
  });
});
