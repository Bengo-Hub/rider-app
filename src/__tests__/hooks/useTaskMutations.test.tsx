import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  useAcceptTask,
  useDeclineTask,
  useReportFailedDelivery,
  useSubmitProof,
  useUpdateTaskStatus,
} from "@/hooks/useTaskMutations";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    patch: vi.fn().mockResolvedValue({ id: "task-1", status: "accepted" }),
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAcceptTask", () => {
  it("PATCHes the task status to accepted", async () => {
    const { result } = renderHook(() => useAcceptTask("urban-loft"), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ taskId: "task-1" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith("/urban-loft/tasks/task-1/status", { status: "accepted" });
  });
});

describe("useUpdateTaskStatus", () => {
  it("PATCHes the next leg", async () => {
    const { result } = renderHook(() => useUpdateTaskStatus("urban-loft"), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ taskId: "task-1", status: "en_route_pickup" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith("/urban-loft/tasks/task-1/status", {
      status: "en_route_pickup",
      reason: undefined,
    });
  });
});

describe("useDeclineTask", () => {
  it("hands the job back with a reason instead of cancelling the customer's delivery", async () => {
    const { result } = renderHook(() => useDeclineTask("urban-loft"), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ taskId: "task-1", reason: "Puncture" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith("/urban-loft/riders/me/tasks/task-1/decline", { reason: "Puncture" });
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });
});

describe("useReportFailedDelivery", () => {
  it("reports a failed delivery with its reason", async () => {
    const { result } = renderHook(() => useReportFailedDelivery("urban-loft"), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ taskId: "task-1", reason: "Customer unreachable" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.patch).toHaveBeenCalledWith("/urban-loft/tasks/task-1/status", {
      status: "failed",
      reason: "Customer unreachable",
    });
  });
});

describe("useSubmitProof", () => {
  it("POSTs the proof of delivery to the task", async () => {
    const { result } = renderHook(() => useSubmitProof("urban-loft"), { wrapper: createWrapper() });
    const proof = {
      confirmation_code: "123456",
      recipient_name: "Jane Doe",
      photo_url: "https://logisticsapi.example/media/uploads/kyc/a.jpg",
      latitude: -0.0607,
      longitude: 34.2855,
    };
    await act(async () => {
      result.current.mutate({ taskId: "task-1", proof });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.post).toHaveBeenCalledWith("/urban-loft/tasks/task-1/pod", proof);
  });
});
