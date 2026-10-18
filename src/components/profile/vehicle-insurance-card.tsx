"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { VehicleInsurance } from "@/types/logistics";

const INPUT =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

/** "2027-03-24" as "24 Mar 2027". */
function day(d?: string) {
  if (!d) return "";
  const t = new Date(`${d}T00:00:00`);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function statusLine(ins: VehicleInsurance) {
  const days = ins.days_left ?? 0;
  switch (ins.status) {
    case "valid":
      return { tone: "text-green-700 bg-green-50", Icon: ShieldCheck, text: `Insured until ${day(ins.expires_on)}` };
    case "expiring":
      return { tone: "text-amber-700 bg-amber-50", Icon: ShieldAlert, text: days <= 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"} (${day(ins.expires_on)})` };
    case "expired":
      return { tone: "text-red-700 bg-red-50", Icon: ShieldOff, text: `Expired on ${day(ins.expires_on)}` };
    default:
      return { tone: "text-red-700 bg-red-50", Icon: ShieldOff, text: "No insurance recorded" };
  }
}

/**
 * The rider's vehicle insurance with a renew form (PUT /riders/me/vehicle/insurance). Saving a
 * valid policy puts a vehicle that was taken off jobs for expired insurance back on jobs.
 */
export function VehicleInsuranceCard({
  orgSlug,
  plate,
  insurance,
  blockMessage,
}: {
  orgSlug: string;
  plate: string;
  insurance?: VehicleInsurance;
  blockMessage?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    policy_no: "",
    certificate_no: "",
    insurer: insurance?.insurer ?? "",
    cover: insurance?.cover ?? "",
    starts_on: "",
    expires_on: "",
    document: "",
  });
  if (!insurance || insurance.status === "not_required") return null;
  const status = statusLine(insurance);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.policy_no.trim() || !form.expires_on) {
      toast.error("Enter the policy number and expiry date from the new certificate");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = { policy_no: form.policy_no.trim(), expires_on: form.expires_on };
      for (const k of ["certificate_no", "insurer", "cover", "starts_on", "document"] as const) {
        if (form[k].trim()) body[k] = form[k].trim();
      }
      await api.put("/riders/me/vehicle/insurance", body);
      await qc.invalidateQueries({ queryKey: ["rider-me", orgSlug] });
      toast.success("Insurance saved. You can take jobs on this vehicle.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the insurance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Vehicle insurance ({plate})</h2>
      </div>
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${status.tone}`}>
        <status.Icon className="h-4 w-4" />
        {status.text}
      </div>
      {insurance.policy_no && (
        <p className="text-xs text-muted-foreground">
          Policy {insurance.policy_no}
          {insurance.insurer ? `, ${insurance.insurer}` : ""}
        </p>
      )}
      {blockMessage && <p className="text-xs text-red-600">You get no delivery jobs until it is renewed.</p>}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-orange-500 py-2.5 text-sm font-medium text-orange-600 active:bg-orange-50"
        >
          {insurance.policy_no ? "Renew insurance" : "Add insurance"}
        </button>
      ) : (
        <div className="space-y-3">
          <input className={INPUT} placeholder="Policy number *" value={form.policy_no} onChange={(e) => set("policy_no", e.target.value)} />
          <input className={INPUT} placeholder="Certificate number" value={form.certificate_no} onChange={(e) => set("certificate_no", e.target.value)} />
          <input className={INPUT} placeholder="Insurer" value={form.insurer} onChange={(e) => set("insurer", e.target.value)} />
          <input className={INPUT} placeholder="Cover (COMP or TPO)" value={form.cover} onChange={(e) => set("cover", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted-foreground">
              Starts on
              <input type="date" className={INPUT} value={form.starts_on} onChange={(e) => set("starts_on", e.target.value)} />
            </label>
            <label className="text-xs text-muted-foreground">
              Expires on *
              <input type="date" className={INPUT} value={form.expires_on} onChange={(e) => set("expires_on", e.target.value)} />
            </label>
          </div>
          <ImageUpload label="Insurance certificate" value={form.document} onChange={(url) => set("document", url)} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save insurance
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2.5 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
