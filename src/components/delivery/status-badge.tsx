"use client";

import type { TaskStatus } from "@/types/logistics";
import { STATUS_LABELS } from "@/types/logistics";

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  en_route_pickup: "bg-amber-100 text-amber-700",
  arrived_pickup: "bg-amber-200 text-amber-800",
  picked_up: "bg-orange-100 text-orange-700",
  en_route_dropoff: "bg-orange-200 text-orange-800",
  arrived_dropoff: "bg-emerald-100 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  failed: "bg-red-200 text-red-800",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
