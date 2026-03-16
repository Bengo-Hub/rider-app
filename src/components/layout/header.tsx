"use client";

import { useAuthStore } from "@/store/auth-store";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Image from "next/image";
import { Bell } from "lucide-react";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const { data: brandConfig } = useBrandConfig();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
             <Image 
               src={brandConfig?.logoUrl || "/icons/rider-icon-192x192.png"} 
               alt={brandConfig?.name || "Rider App"} 
               width={28} 
               height={28} 
               className="rounded-lg shadow-sm"
             />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-foreground leading-tight">
              {user?.name?.split(" ")[0] ?? "Rider"}
            </h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest opacity-80">
              {brandConfig?.shortName || "Urban Loft"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 p-2 text-foreground transition-all hover:bg-secondary active:scale-95">
            <Bell className="h-5 w-5 opacity-70" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-card" />
          </button>
          <ThemeToggle />
          <div className="ml-2 flex items-center gap-2 rounded-full bg-green-500/10 px-2 py-1 border border-green-500/20">
            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">
              Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
