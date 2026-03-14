"use client";

import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { ShieldAlert, UserPlus, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

interface AccessModalProps {
  status: "none" | "pending" | "rejected";
}

export function AccessModal({ status }: AccessModalProps) {
  const orgSlug = useOrgSlug();

  const config = {
    none: {
      icon: UserPlus,
      title: "Become a Rider",
      description: "You need to register as a rider and complete KYC verification to access the delivery dashboard.",
      buttonText: "Register Now",
      buttonHref: "/profile",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    pending: {
      icon: Clock,
      title: "Application Pending",
      description: "Your rider application is currently under review. We'll notify you via email once you are approved.",
      buttonText: "View Profile",
      buttonHref: "/profile",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    rejected: {
      icon: ShieldAlert,
      title: "Access Denied",
      description: "Your application was not approved. Please contact support for more information or update your details.",
      buttonText: "Update Profile",
      buttonHref: "/profile",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  };

  const { icon: Icon, title, description, buttonText, buttonHref, color, bgColor } = config[status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border shadow-xl rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColor}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
        
        <h2 className="mb-2 text-2xl font-bold text-foreground">{title}</h2>
        <p className="mb-8 text-muted-foreground">
          {description}
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full rounded-xl py-6 text-lg font-bold" size="lg">
            <Link href={orgRoute(orgSlug, buttonHref)}>
              {buttonText}
            </Link>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Questions? <button className="text-primary font-medium hover:underline">Contact Support</button>
          </p>
        </div>
      </div>
    </div>
  );
}
