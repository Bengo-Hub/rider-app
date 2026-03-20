"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Image from "next/image";
import { Bell, LogOut, Settings, User } from "lucide-react";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: brandConfig } = useBrandConfig();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          {/* Profile dropdown */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm transition-all hover:bg-primary/20 active:scale-95"
            >
              {user?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-bold text-foreground truncate">{user?.name ?? "Rider"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowMenu(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <Settings className="h-4 w-4 opacity-60" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
