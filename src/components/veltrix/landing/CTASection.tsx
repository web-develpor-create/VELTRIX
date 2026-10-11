"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export function CTASection() {
  const { user, openAuth, setView } = useAppStore();
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl veltrix-bg-gradient p-10 veltrix-glow sm:p-16">
          <div className="absolute inset-0 veltrix-grid opacity-20" />
          <div className="relative text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ship your first website today.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/90">
              Free to start, free to publish, free forever. No credit card. No fake URLs.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => (user ? setView("dashboard") : openAuth("signup"))}
                className="bg-white text-veltrix-indigo hover:bg-white/90"
              >
                <Rocket className="mr-2 h-4 w-4" />
                {user ? "Open dashboard" : "Start free"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
