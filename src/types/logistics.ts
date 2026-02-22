export type TaskStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "en_route_pickup"
  | "arrived_pickup"
  | "picked_up"
  | "en_route_dropoff"
  | "arrived_dropoff"
  | "completed"
  | "cancelled"
  | "failed";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: string;
  tenant_id: string;
  tenant_slug: string;
  external_reference: string;
  external_type: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_rider_id: string | null;
  pickup_address: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_notes: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  dropoff_address: string;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  dropoff_notes: string;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  customer_name: string;
  customer_phone: string;
  instructions: string;
  items_description: string;
  item_count: number;
  distance_km: number | null;
  eta_minutes: number | null;
  eta_at: string | null;
  assigned_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  failure_reason: string;
  idempotency_key: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  data: Task[];
  total: number;
  limit: number;
  offset: number;
}

export interface FleetMember {
  id: string;
  tenant_id: string;
  fleet_id: string;
  user_id: string;
  driver_code: string | null;
  status: "pending" | "active" | "suspended" | "inactive";
  vehicle_id: string | null;
  joined_at: string | null;
  suspended_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TrackingInfo {
  task_id: string;
  status: TaskStatus;
  rider_id: string | null;
  rider_latitude: number | null;
  rider_longitude: number | null;
  eta_minutes: number | null;
  eta_at: string | null;
  distance_km: number | null;
  last_updated_at: string;
}

export interface ProofOfDelivery {
  task_id: string;
  rider_id: string;
  photo_url: string;
  delivery_code: string;
  recipient_name: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  completed_at: string;
}

export const ACTIVE_STATUSES: TaskStatus[] = [
  "assigned",
  "accepted",
  "en_route_pickup",
  "arrived_pickup",
  "picked_up",
  "en_route_dropoff",
  "arrived_dropoff",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  accepted: "Accepted",
  en_route_pickup: "En Route to Pickup",
  arrived_pickup: "At Pickup",
  picked_up: "Picked Up",
  en_route_dropoff: "En Route to Drop-off",
  arrived_dropoff: "At Drop-off",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const NEXT_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
  assigned: "accepted",
  accepted: "en_route_pickup",
  en_route_pickup: "arrived_pickup",
  arrived_pickup: "picked_up",
  picked_up: "en_route_dropoff",
  en_route_dropoff: "arrived_dropoff",
};
