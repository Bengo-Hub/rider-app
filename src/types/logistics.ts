export type TaskStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "en_route_pickup"
  | "arrived_pickup"
  | "picked_up"
  | "en_route_dropoff"
  | "arrived_dropoff"
  | "en_route"
  | "delivered"
  | "completed"
  | "cancelled"
  | "failed";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: string;
  /** The customer has a delivery code the rider must enter (the code itself is never sent). */
  pod_code_required?: boolean;
  tenant_id: string;
  tenant_slug: string;
  external_reference: string;
  /** Public tracking code of the delivery. */
  tracking_code?: string;
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
  /** Source order number (e.g. ORD-260925-000123) the outlet staff know the order by. */
  order_number?: string;
  payment_method?: string;
  /** Cash (or M-Pesa to the business) the rider collects at the door; 0 when prepaid. */
  cash_on_delivery?: number;
  distance_km: number | null;
  /** Delivery area of the drop-off (e.g. "Bugengi"), set by the checkout quote or intake. */
  zone_id?: string;
  zone_name?: string;
  /** Delivery fee the customer paid for this trip. */
  delivery_fee?: number;
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
  page: number;
  hasMore: boolean;
}

export interface FleetMember {
  id: string;
  tenant_id: string;
  fleet_id: string;
  user_id: string;
  driver_code: string | null;
  status: "pending" | "active" | "suspended" | "inactive";
  vehicle_id: string | null;
  average_rating: number;
  total_ratings: number;
  specialization_tags?: string[];
  has_cold_storage?: boolean;
  joined_at: string | null;
  suspended_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  edges?: {
    vehicle?: {
      id: string;
      vehicle_type: string;
      make: string;
      model: string;
      license_plate: string;
      status: string;
    };
  };
}

export interface RiderMeResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: string;
  };
  status: string;
  /** freelance riders go through KYC review; staff riders are HR-vetted employees and do not. */
  employment?: "freelance" | "staff";
  rider?: FleetMember;
  vehicle?: {
    id: string;
    vehicle_type: string;
    make: string;
    model: string;
    license_plate: string;
    status: string;
  };
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

/** Statuses of a job the rider is working on. en_route is the older single "on the way"
 * state some tasks still use; the rider completes it with proof of delivery. */
export const ACTIVE_STATUSES: TaskStatus[] = [
  "assigned",
  "accepted",
  "en_route_pickup",
  "arrived_pickup",
  "picked_up",
  "en_route_dropoff",
  "en_route",
  "arrived_dropoff",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  accepted: "Accepted",
  en_route_pickup: "En Route to Pickup",
  arrived_pickup: "At Pickup",
  picked_up: "Picked Up",
  en_route_dropoff: "Driving to destination",
  arrived_dropoff: "At Drop-off",
  en_route: "On the way",
  delivered: "Delivered",
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
