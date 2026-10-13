"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Landmark, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useMyPayoutMethod, useSaveMyPayoutMethod, type PayoutMethod } from "@/hooks/useEarnings";

// Where the business sends the rider's earnings when it pays a statement. M-Pesa is the usual
// choice; a bank account works through Paystack. Logistics validates and normalises the phone.

type Method = Extract<PayoutMethod["payout_method"], "mpesa_b2c" | "paystack_bank">;

const inputCls = "mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300";

export function PayoutMethodCard() {
  const { data, isLoading, isError, refetch } = useMyPayoutMethod();
  const save = useSaveMyPayoutMethod();
  const [method, setMethod] = useState<Method>("mpesa_b2c");
  const [phone, setPhone] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [account, setAccount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!data) return;
    setMethod(data.payout_method === "paystack_bank" ? "paystack_bank" : "mpesa_b2c");
    setPhone(data.payout_phone ? `+${data.payout_phone.replace(/^\+/, "")}` : "");
    setBankCode(data.payout_bank_code ?? "");
    setAccountName(data.payout_account_name ?? "");
    setAccount("");
  }, [data]);

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;
  if (isError) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-gray-600">
        Could not load your payout details.{" "}
        <button className="font-medium text-orange-600" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const configured = !!data && (data.payout_method === "paystack_bank" ? !!data.payout_account_number : !!data.payout_phone);
  const suspended = data?.payout_status === "suspended";
  const showForm = editing || !configured;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      method === "mpesa_b2c"
        ? { payout_method: method, payout_phone: phone }
        : { payout_method: method, payout_bank_code: bankCode, account_number: account, account_name: accountName },
      {
        onSuccess: () => {
          toast.success("Payout details saved");
          setEditing(false);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save your payout details"),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-bold">Where you get paid</h2>
        <p className="text-xs text-gray-500">When the business pays your statements, the money goes here.</p>
      </div>

      {suspended && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Payouts to you are on hold. Speak to the business.
        </p>
      )}

      {!showForm && data ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
          <div className="flex items-center gap-3">
            {data.payout_method === "paystack_bank" ? (
              <Landmark className="h-5 w-5 text-orange-500" />
            ) : (
              <Smartphone className="h-5 w-5 text-green-600" />
            )}
            <div className="text-sm">
              <p className="font-semibold">{data.payout_method === "paystack_bank" ? "Bank account" : "M-Pesa"}</p>
              <p className="text-gray-500">
                {data.payout_method === "paystack_bank"
                  ? `${data.payout_account_name || "Account"} ${data.payout_account_number ?? ""}`
                  : `+${(data.payout_phone ?? "").replace(/^\+/, "")}`}
              </p>
            </div>
          </div>
          <button className="text-sm font-medium text-orange-600" onClick={() => setEditing(true)}>
            Change
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: "mpesa_b2c", label: "M-Pesa", Icon: Smartphone },
                { v: "paystack_bank", label: "Bank", Icon: Landmark },
              ] as const
            ).map(({ v, label, Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => setMethod(v)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium ${
                  method === v ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {method === "mpesa_b2c" ? (
            <label className="block text-sm font-medium">
              M-Pesa number
              <input className={inputCls} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" required />
            </label>
          ) : (
            <>
              <label className="block text-sm font-medium">
                Bank code
                <input className={inputCls} value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="Your bank's code" required />
              </label>
              <label className="block text-sm font-medium">
                Account number
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={data?.payout_account_number ? `Current ${data.payout_account_number}` : ""}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Name on the account
                <input className={inputCls} value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </label>
            </>
          )}

          <div className="flex gap-2">
            {configured && (
              <button type="button" className="h-11 flex-1 rounded-xl border border-gray-200 text-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={save.isPending}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white disabled:opacity-60"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
