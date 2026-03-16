"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MapPin, Navigation, Car, Bike, Send, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RideRequestPage() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("car");

  const vehicles = [
    { id: "car", name: "Modern Sedan", icon: Car, time: "4 min", price: "KES 450" },
    { id: "bike", name: "Boda Boda", icon: Bike, time: "2 min", price: "KES 150" },
    { id: "premium", name: "Premium XL", icon: Car, time: "7 min", price: "KES 800", premium: true },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <Header />
      
      <main className="flex-1 space-y-6">
        {/* Map Placeholder */}
        <div className="relative h-[35vh] w-full bg-muted overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,1,0,0/400x400?access_token=none')] bg-cover opacity-50 grayscale" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Navigation className="size-8 text-primary" />
            </div>
            <p className="mt-4 text-sm font-bold text-muted-foreground">Map View Initializing...</p>
          </div>
          
          {/* Draggable center marker highlight */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <MapPin className="size-8 text-primary animate-bounce" />
          </div>
        </div>

        <div className="px-4 -mt-10 relative z-10">
          <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-black/5">
            <h2 className="text-lg font-black tracking-tight text-foreground mb-6">Where to?</h2>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500" />
                <input
                  type="text"
                  placeholder="Pickup location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full h-12 rounded-2xl border bg-secondary/30 pl-10 pr-4 text-sm font-bold focus:border-primary focus:outline-none transition-all"
                />
              </div>
              
              <div className="absolute left-7 top-[72px] h-8 border-l-2 border-dashed border-muted-foreground/30 ml-[-1px]" />

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 size-2 rounded-sm bg-primary" />
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full h-12 rounded-2xl border bg-secondary/30 pl-10 pr-4 text-sm font-bold focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70">
                Choose Vehicle
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                      selectedVehicle === v.id
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <v.icon className={`size-6 ${selectedVehicle === v.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-center">
                      <p className={`text-[10px] font-black leading-tight ${selectedVehicle === v.id ? "text-foreground" : "text-muted-foreground"}`}>
                        {v.name}
                      </p>
                      <p className="text-[9px] font-bold text-primary mt-0.5">{v.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button className="mt-8 w-full h-14 rounded-2xl bg-primary text-white font-black text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              Request Ride Now <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </div>

        {/* Recent Rides / Suggestions */}
        <div className="px-4 pb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-70 mb-4 px-2">
            Recent Destinations
          </h3>
          <div className="space-y-2">
            <button className="flex w-full items-center gap-4 rounded-2xl bg-muted/30 p-4 transition-all hover:bg-muted/50 text-left">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                <Clock className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">The Junction Mall, Ngong Rd</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Last ride: 2 days ago</p>
              </div>
            </button>
            <button className="flex w-full items-center gap-4 rounded-2xl bg-muted/30 p-4 transition-all hover:bg-muted/50 text-left">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                <Clock className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">Westlands Square</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Home • 1.2km</p>
              </div>
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
