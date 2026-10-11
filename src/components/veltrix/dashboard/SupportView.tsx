"use client";

import { useAppStore } from "@/store/app-store";
import { SupportSettings } from "@/components/veltrix/dashboard/Settings";

export function SupportView() {
  const { user, openAuth } = useAppStore();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to contact support</h1>
          <p className="mt-2 text-muted-foreground">Support requests are tied to your account.</p>
          <button
            onClick={() => openAuth("login")}
            className="mt-4 rounded-md veltrix-bg-gradient px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="pt-10">
      <SupportSettings />
    </div>
  );
}
