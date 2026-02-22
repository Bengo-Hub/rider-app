"use client";

import type { Task } from "@/types/logistics";
import { StatusBadge } from "./status-badge";
import { MapPin, Package, Clock } from "lucide-react";

interface DeliveryCardProps {
  task: Task;
  onAccept?: (taskId: string) => void;
  onView?: (taskId: string) => void;
  accepting?: boolean;
}

export function DeliveryCard({ task, onAccept, onView, accepting }: DeliveryCardProps) {
  const timeAgo = getTimeAgo(task.created_at);

  return (
    <div
      className="rounded-xl border bg-white p-4 shadow-sm active:bg-gray-50"
      onClick={() => onView?.(task.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            {task.priority === "urgent" && (
              <span className="text-xs font-semibold text-red-600">URGENT</span>
            )}
          </div>
          <p className="mt-2 truncate text-sm font-medium text-gray-900">
            {task.customer_name || "Customer"}
          </p>
        </div>
        {task.distance_km && (
          <span className="ml-2 text-xs text-gray-500">
            {task.distance_km.toFixed(1)} km
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
            <MapPin className="h-3 w-3 text-green-600" />
          </div>
          <p className="text-xs text-gray-600 line-clamp-1">{task.pickup_address || "Pickup location"}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <MapPin className="h-3 w-3 text-orange-600" />
          </div>
          <p className="text-xs text-gray-600 line-clamp-1">{task.dropoff_address || "Drop-off location"}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.item_count > 0 && (
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" /> {task.item_count} item{task.item_count !== 1 ? "s" : ""}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo}
          </span>
        </div>

        {task.status === "pending" && onAccept && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept(task.id);
            }}
            disabled={accepting}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white active:bg-orange-600 disabled:opacity-50"
          >
            {accepting ? "..." : "Accept"}
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
