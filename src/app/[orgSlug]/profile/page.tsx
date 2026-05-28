"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Bike, Car, Loader2, Save, Star, Tag, Truck } from "lucide-react";

import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useRiderProfile } from "@/hooks/useRiderProfile";
import { useMyEarnings } from "@/hooks/useEarnings";
import { useDeliveries } from "@/hooks/useDeliveries";

const vehicleTypes = [
  { value: "bike", label: "Motorbike", icon: Bike },
  { value: "car", label: "Car", icon: Car },
  { value: "van", label: "Van", icon: Truck },
  { value: "truck", label: "Truck", icon: Truck },
] as const;

export default function ProfilePage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { data: profileData } = useRiderProfile(orgSlug);
  const riderData = profileData?.rider;
  const { data: earnings } = useMyEarnings();
  const { data: completedData } = useDeliveries({ tenantSlug: orgSlug, status: "completed", limit: 1 });

  const [phone, setPhone] = useState(user?.phone ?? "");
  const [vehicleType, setVehicleType] = useState("bike");
  const [licenseNo, setLicenseNo] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idPassportAttachment, setIdPassportAttachment] = useState("");
  const [riderPhoto, setRiderPhoto] = useState("");
  const [imageLicensePlate, setImageLicensePlate] = useState("");
  const [imageSideView, setImageSideView] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!vehicleType) {
      toast.error("Please select a vehicle type");
      return;
    }

    if (!idPassportAttachment || !riderPhoto || !imageLicensePlate || !imageSideView) {
      toast.error("Please upload all required KYC documents");
      return;
    }

    setSaving(true);
    try {
      const result = await api.patch<{ user: typeof user }>("/riders/me/profile", {
        phone: phone.trim(),
        vehicle_type: vehicleType,
        license_no: licenseNo.trim() || undefined,
        license_plate: licensePlate.trim() || undefined,
        id_number: idNumber.trim() || undefined,
        id_passport_attachment: idPassportAttachment,
        rider_photo: riderPhoto,
        image_license_plate: imageLicensePlate,
        image_side_view: imageSideView,
      });

      if (result.user) {
        setUser(result.user);
      }

      toast.success("Profile updated successfully. Your application is now under review.");
      router.push(orgRoute(orgSlug, "/"));
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={orgRoute(orgSlug, "/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Complete Profile</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        {/* Scorecard — only shown for active riders */}
        {riderData && riderData.status === "active" && (
          <div className="mb-5 rounded-xl border bg-card p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Your Performance</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/40 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            </div>

            {/* KPI grid — 4 stats */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Rating */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-500" />
                  <span className="text-xl font-bold">
                    {riderData.average_rating > 0 ? riderData.average_rating.toFixed(1) : "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Avg Rating</p>
              </div>

              {/* Deliveries rated */}
              <div className="rounded-lg bg-primary/5 p-3 text-center">
                <p className="text-xl font-bold text-primary">{riderData.total_ratings}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Rated Deliveries</p>
              </div>

              {/* Total completed */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {completedData?.total ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Total Completed</p>
              </div>

              {/* This week earnings */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {earnings
                    ? `${earnings.currency} ${earnings.week.toLocaleString()}`
                    : "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">This Week</p>
              </div>
            </div>

            {/* Rating bar */}
            {riderData.average_rating > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Rating score</span>
                  <span>{((riderData.average_rating / 5) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(riderData.average_rating / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Specialization tags */}
            {riderData.specialization_tags && riderData.specialization_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                {riderData.specialization_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact Info */}
          <section className="rounded-xl border bg-card p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Contact Information</h2>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-muted-foreground mb-1">
                National ID / Passport Number
              </label>
              <input
                id="idNumber"
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g., 12345678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ImageUpload
                label="ID / Passport Copy"
                value={idPassportAttachment}
                onChange={setIdPassportAttachment}
                required
              />
              <ImageUpload
                label="Rider Passport Photo"
                value={riderPhoto}
                onChange={setRiderPhoto}
                required
              />
            </div>
          </section>

          {/* Vehicle Info */}
          <section className="rounded-xl border bg-card p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Vehicle Details</h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Vehicle Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {vehicleTypes.map((vt) => {
                  const Icon = vt.icon;
                  const selected = vehicleType === vt.value;
                  return (
                    <button
                      key={vt.value}
                      type="button"
                      onClick={() => setVehicleType(vt.value)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {vt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-muted-foreground mb-1">
                License Plate
              </label>
              <input
                id="licensePlate"
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g., KDA 123A"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label htmlFor="licenseNo" className="block text-sm font-medium text-muted-foreground mb-1">
                Driving License Number
              </label>
              <input
                id="licenseNo"
                type="text"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="e.g., DL-12345"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ImageUpload
                label="Vehicle (License Plate)"
                value={imageLicensePlate}
                onChange={setImageLicensePlate}
                required
              />
              <ImageUpload
                label="Vehicle (Side View)"
                value={imageSideView}
                onChange={setImageSideView}
                required
              />
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white active:bg-orange-600 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </button>

          {user?.status === "pending" && (
            <p className="text-center text-xs text-gray-500">
              Your account is pending review. Complete your profile to speed up approval.
            </p>
          )}
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
