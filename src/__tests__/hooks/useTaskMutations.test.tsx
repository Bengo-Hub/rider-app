import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useAcceptTask, useCancelTask, useSubmitProof, useUpdateTaskStatus } from "@/hooks/useTaskMutations";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    put: vi.fn().mockResolvedValue({ id: "task-1", status: "accepted" }),
    post: vi.fn().mockResolvedValue({ message: "success" }),
  },
}));

import { api } from "@/lib/api";

const mockedApi = vi.mocked(api);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAcceptTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PUT with status accepted", async () => {
    const { result } = renderHook(() => useAcceptTask("urban-loft"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ taskId: "task-1" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      "/urban-loft/tasks/task-1/status",
      { status: "accepted" },
    );
  });
});

describe("useUpdateTaskStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PUT with status and optional reason", async () => {
    const { result } = renderHook(() => useUpdateTaskStatus("urban-loft"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        taskId: "task-1",
        status: "en_route_pickup" as never,
        reason: "Heading out",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      "/urban-loft/tasks/task-1/status",
      { status: "en_route_pickup", reason: "Heading out" },
    );
  });
});

describe("useCancelTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST with reason", async () => {
    const { result } = renderHook(() => useCancelTask("urban-loft"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ taskId: "task-1", reason: "Customer unreachable" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/urban-loft/tasks/task-1/cancel",
      { reason: "Customer unreachable" },
    );
  });
});

describe("useSubmitProof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST with proof payload including GPS", async () => {
    const { result } = renderHook(() => useSubmitProof("urban-loft"), {
      wrapper: createWrapper(),
    });

    const proof = {
      delivery_code: "1234",
      recipient_name: "Jane Doe",
      notes: "Left at reception",
      latitude: -0.0607,
      longitude: 34.2855,
    };

    await act(async () => {
      result.current.mutate({ taskId: "task-1", proof });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/urban-loft/deliveries/task-1/proof",
      proof,
    );
  });
});
