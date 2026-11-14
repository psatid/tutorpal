import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getV1Config = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiClient: { getV1Config },
}));

import { usePublicConfig } from "@/lib/public-config";

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { queryClient, QueryWrapper };
}

describe("usePublicConfig", () => {
  beforeEach(() => {
    getV1Config.mockReset();
  });

  it("fails closed while loading and when the server payload is not the exact public configuration", async () => {
    getV1Config.mockResolvedValue({
      data: {
        publicSignupEnabled: true,
        socialLogin: { google: false, line: false },
        unexpected: true,
      },
    });
    const { QueryWrapper } = createQueryWrapper();

    const { result } = renderHook(() => usePublicConfig(), {
      wrapper: QueryWrapper,
    });

    expect(result.current.betaEnabled).toBe(true);
    expect(result.current.publicSignupEnabled).toBe(false);
    expect(result.current.socialLogin).toEqual({ google: false, line: false });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.betaEnabled).toBe(true);
    expect(result.current.publicSignupEnabled).toBe(false);
    expect(result.current.socialLogin).toEqual({ google: false, line: false });
  });

  it("uses public signup only after a complete valid response", async () => {
    getV1Config.mockResolvedValue({
      data: {
        publicSignupEnabled: true,
        socialLogin: { google: true, line: false },
      },
    });
    const { QueryWrapper } = createQueryWrapper();

    const { result } = renderHook(() => usePublicConfig(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.betaEnabled).toBe(false);
    expect(result.current.publicSignupEnabled).toBe(true);
    expect(result.current.socialLogin).toEqual({ google: true, line: false });
  });

  it("keeps a validated launch mode through stale, fetching, and failed refreshes while masking capabilities", async () => {
    getV1Config.mockResolvedValueOnce({
      data: {
        publicSignupEnabled: true,
        socialLogin: { google: true, line: true },
      },
    });
    let rejectRefresh: (reason?: unknown) => void = () => undefined;
    getV1Config.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectRefresh = reject;
        }),
    );
    getV1Config.mockResolvedValueOnce({
      data: {
        publicSignupEnabled: false,
        socialLogin: { google: false, line: false },
      },
    });
    const { queryClient, QueryWrapper } = createQueryWrapper();
    const { result } = renderHook(() => usePublicConfig(), {
      wrapper: QueryWrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.betaEnabled).toBe(false);
    expect(result.current.publicSignupEnabled).toBe(true);
    expect(result.current.socialLogin).toEqual({ google: true, line: true });

    act(() => {
      void queryClient.invalidateQueries({ queryKey: ["public-config"] });
    });

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current.isStale).toBe(true);
    expect(result.current.betaEnabled).toBe(false);
    expect(result.current.publicSignupEnabled).toBe(false);
    expect(result.current.socialLogin).toEqual({ google: false, line: false });

    act(() => rejectRefresh(new Error("fixture refresh failure")));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.betaEnabled).toBe(false);
    expect(result.current.publicSignupEnabled).toBe(false);
    expect(result.current.socialLogin).toEqual({ google: false, line: false });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.betaEnabled).toBe(true);
    expect(result.current.publicSignupEnabled).toBe(false);
  });
});
