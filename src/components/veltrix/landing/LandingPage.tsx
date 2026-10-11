"use client";

import { Hero } from "./Hero";
import { Features } from "./Features";
import { TemplatesPreview } from "./TemplatesPreview";
import { Pricing } from "./Pricing";
import { FAQ } from "./FAQ";
import { CTASection } from "./CTASection";

export function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <TemplatesPreview />
      <Pricing />
      <FAQ />
      <CTASection />
    </>
  );
}
