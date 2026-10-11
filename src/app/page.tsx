"use client";

import { useEffect } from "react";
import { useAppStore, bootstrapUser } from "@/store/app-store";
import { Navbar } from "@/components/veltrix/shared/Navbar";
import { Footer } from "@/components/veltrix/shared/Footer";
import { AuthModal } from "@/components/veltrix/auth/AuthModal";
import { LandingPage } from "@/components/veltrix/landing/LandingPage";
import { TemplatesGallery } from "@/components/veltrix/editor/TemplatesGallery";
import { Dashboard } from "@/components/veltrix/dashboard/Dashboard";
import { WebsiteEditor } from "@/components/veltrix/editor/WebsiteEditor";
import { Settings } from "@/components/veltrix/dashboard/Settings";
import { Domains } from "@/components/veltrix/dashboard/Domains";
import { AdminPanel } from "@/components/veltrix/admin/AdminPanel";
import { Docs } from "@/components/veltrix/dashboard/Docs";
import { PricingView } from "@/components/veltrix/dashboard/PricingView";
import { SupportView } from "@/components/veltrix/dashboard/SupportView";

export default function Home() {
  const { user, view, authLoading, setView } = useAppStore();

  // Fetch the current user once on mount
  useEffect(() => {
    bootstrapUser();
  }, []);

  // If user is required for the view but not signed in, bounce to landing
  useEffect(() => {
    if (authLoading) return;
    const authedViews = ["dashboard", "editor", "settings", "domains", "admin", "support"];
    if (authedViews.includes(view) && !user) {
      setView("landing");
      useAppStore.getState().openAuth("login");
    }
  }, [view, user, authLoading, setView]);

  // Render the active view
  let content: React.ReactNode;
  switch (view) {
    case "landing":
      content = <LandingPage />;
      break;
    case "templates":
      content = <TemplatesGallery />;
      break;
    case "dashboard":
      content = <Dashboard />;
      break;
    case "editor":
      content = <WebsiteEditor />;
      break;
    case "settings":
      content = <Settings />;
      break;
    case "domains":
      content = <Domains />;
      break;
    case "admin":
      content = <AdminPanel />;
      break;
    case "docs":
      content = <Docs />;
      break;
    case "pricing":
      content = <PricingView />;
      break;
    case "support":
      content = <SupportView />;
      break;
    default:
      content = <LandingPage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{content}</main>
      <Footer />
      <AuthModal />
    </div>
  );
}
