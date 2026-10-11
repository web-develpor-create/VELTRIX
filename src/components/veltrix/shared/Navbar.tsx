"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { VeltrixLogo } from "./VeltrixLogo";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut, Shield, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { user, setView, openAuth, mobileNavOpen, setMobileNavOpen, view } = useAppStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const go = (v: any) => {
    setView(v);
    setMobileNavOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      useAppStore.getState().setUser(null);
      setView("landing");
    } finally {
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { id: "templates", label: "Templates" },
    { id: "pricing", label: "Pricing" },
    { id: "docs", label: "Docs" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => go(user ? "dashboard" : "landing")}
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="VELTRIX home"
        >
          <VeltrixLogo size={28} />
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {!user &&
            navLinks.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className={`rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${
                  view === l.id ? "text-foreground" : ""
                }`}
              >
                {l.label}
              </button>
            ))}
          {user && (
            <button
              onClick={() => go("dashboard")}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                view === "dashboard" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
          )}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => openAuth("signup")}
                className="veltrix-bg-gradient text-white hover:opacity-90 veltrix-glow-sm"
              >
                Get started free
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 p-1 pr-3 transition-colors hover:bg-secondary">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="veltrix-bg-gradient text-white text-xs font-semibold">
                      {(user.name || user.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[140px] truncate text-sm font-medium">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("support")}>
                  Support
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => go("admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Admin panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> {loggingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle menu"
        >
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileNavOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="space-y-1 px-4 py-4">
            {!user ? (
              <>
                {navLinks.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => go(l.id)}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {l.label}
                  </button>
                ))}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openAuth("login")}>
                    Sign in
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuth("signup")}
                    className="veltrix-bg-gradient text-white"
                  >
                    Get started
                  </Button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => go("dashboard")}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => go("settings")}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
                >
                  Settings
                </button>
                <button
                  onClick={() => go("support")}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
                >
                  Support
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => go("admin")}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
                  >
                    Admin panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-secondary"
                >
                  {loggingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
