"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "@/types/logistics";
import { STATUS_LABELS, NEXT_STATUS } from "@/types/logistics";
import { StatusBadge } from "./status-badge";
import { MapPin, Phone, Navigation, Package, ChevronRight, Camera, CheckCircle, X } from "lucide-react";

export interface ProofOfDelivery {
  delivery_code?: string;
  photo_url?: string;
  recipient_name?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface ActiveDeliveryViewProps {
  task: Task;
  onAdvanceStatus: (taskId: string, nextStatus: TaskStatus) => void;
  onCancel: (taskId: string) => void;
  onSubmitProof?: (taskId: string, proof: ProofOfDelivery) => void;
  advancing?: boolean;
  submittingProof?: boolean;
}

const STEP_ORDER: TaskStatus[] = [
  "accepted",
  "en_route_pickup",
  "arrived_pickup",
  "picked_up",
  "en_route_dropoff",
  "arrived_dropoff",
];

export function ActiveDeliveryView({
  task,
  onAdvanceStatus,
  onCancel,
  onSubmitProof,
  advancing,
  submittingProof,
}: ActiveDeliveryViewProps) {
  const nextStatus = NEXT_STATUS[task.status];
  const currentStepIdx = STEP_ORDER.indexOf(task.status);
  const [showProofForm, setShowProofForm] = useState(false);
  const [proofData, setProofData] = useState<ProofOfDelivery>({
    delivery_code: "",
    recipient_name: task.customer_name || "",
    notes: "",
  });

  const openInMaps = (lat: number | null, lng: number | null, address: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
    }
  };

  const isPickupPhase = ["accepted", "en_route_pickup", "arrived_pickup"].includes(task.status);

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Current Status</p>
            <p className="text-lg font-bold">{STATUS_LABELS[task.status]}</p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Progress Steps */}
        <div className="mt-4 flex gap-1">
          {STEP_ORDER.map((step, i) => (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full ${
                i <= currentStepIdx ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Location Cards */}
      <div className="space-y-3">
        {/* Pickup */}
        <div
          className={`rounded-xl border p-4 ${isPickupPhase ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">PICKUP</p>
                <p className="text-sm font-medium">{task.pickup_address || "Pickup location"}</p>
                {task.pickup_contact_name && (
                  <p className="mt-1 text-xs text-gray-600">{task.pickup_contact_name}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {task.pickup_contact_phone && (
                <a
                  href={`tel:${task.pickup_contact_phone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 active:bg-green-200"
                >
                  <Phone className="h-4 w-4 text-green-600" />
                </a>
              )}
              {isPickupPhase && (
                <button
                  onClick={() =>
                    openInMaps(task.pickup_latitude, task.pickup_longitude, task.pickup_address)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 active:bg-blue-200"
                >
                  <Navigation className="h-4 w-4 text-blue-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dropoff */}
        <div
          className={`rounded-xl border p-4 ${!isPickupPhase ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">DROP-OFF</p>
                <p className="text-sm font-medium">{task.dropoff_address || "Drop-off location"}</p>
                {task.customer_name && (
                  <p className="mt-1 text-xs text-gray-600">{task.customer_name}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {task.customer_phone && (
                <a
                  href={`tel:${task.customer_phone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 active:bg-green-200"
                >
                  <Phone className="h-4 w-4 text-green-600" />
                </a>
              )}
              {!isPickupPhase && (
                <button
                  onClick={() =>
                    openInMaps(task.dropoff_latitude, task.dropoff_longitude, task.dropoff_address)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 active:bg-blue-200"
                >
                  <Navigation className="h-4 w-4 text-blue-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      {(task.items_description || task.instructions) && (
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium">Order Details</p>
          </div>
          {task.items_description && (
            <p className="mt-2 text-sm text-gray-600">{task.items_description}</p>
          )}
          {task.instructions && (
            <p className="mt-1 text-xs text-gray-500">Note: {task.instructions}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pb-24">
        {nextStatus && (
          <button
            onClick={() => onAdvanceStatus(task.id, nextStatus)}
            disabled={advancing}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-base font-semibold text-white active:bg-orange-600 disabled:opacity-50"
          >
            {advancing ? "Updating..." : STATUS_LABELS[nextStatus]}
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {task.status === "arrived_dropoff" && !showProofForm && (
          <button
            onClick={() => setShowProofForm(true)}
            className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-base font-semibold text-white active:bg-green-700"
          >
            <CheckCircle className="h-5 w-5" />
            Complete Delivery
          </button>
        )}

        {/* Proof of Delivery Form */}
        {showProofForm && task.status === "arrived_dropoff" && (
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Proof of Delivery</h3>
              <button
                onClick={() => setShowProofForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-green-100"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Delivery Code */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Delivery Code (from customer)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={proofData.delivery_code ?? ""}
                onChange={(e) => setProofData((p) => ({ ...p, delivery_code: e.target.value }))}
                placeholder="Enter 4-digit code"
                maxLength={6}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={proofData.recipient_name ?? ""}
                onChange={(e) => setProofData((p) => ({ ...p, recipient_name: e.target.value }))}
                placeholder="Who received the order?"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Photo Capture */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Photo Proof (optional)
              </label>
              <label className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-600 active:bg-gray-50">
                <Camera className="h-5 w-5" />
                {proofData.photo_url ? (
                  <span className="text-green-600 font-semibold">✓ Photo captured</span>
                ) : (
                  "Take a photo"
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // Compress and convert to base64 for storage in task metadata
                    const img = new Image();
                    const objectUrl = URL.createObjectURL(file);
                    img.onload = () => {
                      const MAX = 800;
                      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                      const canvas = document.createElement("canvas");
                      canvas.width = Math.round(img.width * scale);
                      canvas.height = Math.round(img.height * scale);
                      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
                      URL.revokeObjectURL(objectUrl);
                      setProofData((p) => ({ ...p, photo_url: dataUrl }));
                    };
                    img.src = objectUrl;
                  }}
                />
              </label>
              {proofData.photo_url && (
                <img
                  src={proofData.photo_url}
                  alt="Proof of delivery"
                  className="mt-2 h-24 w-full rounded-xl object-cover border border-gray-200"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={proofData.notes ?? ""}
                onChange={(e) => setProofData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base resize-none focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Submit */}
            <button
              onClick={() => {
                if (onSubmitProof) {
                  // Auto-capture GPS if available
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        onSubmitProof(task.id, {
                          ...proofData,
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        });
                      },
                      () => onSubmitProof(task.id, proofData),
                      { timeout: 3000 },
                    );
                  } else {
                    onSubmitProof(task.id, proofData);
                  }
                } else {
                  onAdvanceStatus(task.id, "completed" as TaskStatus);
                }
              }}
              disabled={submittingProof || advancing}
              className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-base font-semibold text-white active:bg-green-700 disabled:opacity-50"
            >
              {submittingProof || advancing ? "Submitting..." : "Confirm & Complete"}
            </button>
          </div>
        )}

        {!["completed", "cancelled", "failed"].includes(task.status) && !showProofForm && (
          <button
            onClick={() => onCancel(task.id)}
            className="w-full min-h-[44px] rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 active:bg-red-50"
          >
            Cancel Delivery
          </button>
        )}
      </div>
    </div>
  );
}
