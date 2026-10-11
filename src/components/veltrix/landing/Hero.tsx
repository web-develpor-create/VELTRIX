"use client";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { VeltrixMark } from "@/components/veltrix/shared/VeltrixLogo";
import { motion } from "framer-motion";
import { Sparkles, Rocket, Globe, Shield, Zap, Code, Server, Check } from "lucide-react";

export function Hero() {
  const { openAuth, user, setView } = useAppStore();

  const cta = () => {
    if (user) setView("dashboard");
    else openAuth("signup");
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0 veltrix-grid opacity-50" />
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-veltrix-indigo/20 via-veltrix-purple/10 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-4 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-veltrix-purple" />
            Free website builder + real free hosting
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Build a website.
            <br />
            <span className="veltrix-text-gradient">Host it free.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            VELTRIX is a complete website builder with templates, a visual editor, and one-click publishing to real free hosting on your own Netlify account. No fake URLs, no trial timers, no hidden fees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={cta}
              className="veltrix-bg-gradient w-full px-8 text-base veltrix-glow hover:opacity-90 sm:w-auto"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {user ? "Open dashboard" : "Start building free"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView("templates")}
              className="w-full sm:w-auto"
            >
              Browse templates
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Real Netlify deployment</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Your own provider account</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Provider-owned subdomain</span>
          </motion.div>
        </div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="veltrix-border-gradient veltrix-glow rounded-2xl bg-card/40 p-2 backdrop-blur-sm">
            <div className="rounded-xl border border-border/40 bg-background/80 p-6">
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="mx-auto max-w-md rounded-md bg-secondary/60 px-3 py-1 text-center text-xs text-muted-foreground">
                    https://my-shop.netlify.app
                  </div>
                </div>
              </div>
              <div className="grid gap-4 py-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="veltrix-bg-gradient mb-3 inline-block rounded-md px-2 py-1 text-xs text-white">LIVE</div>
                  <h3 className="text-2xl font-bold">My Shop</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Handmade goods for everyday life. Just published via VELTRIX.</p>
                  <div className="mt-4 flex gap-2">
                    <div className="h-8 w-24 rounded-md veltrix-bg-gradient" />
                    <div className="h-8 w-24 rounded-md border border-border/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-secondary to-secondary/40" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -left-4 top-1/4 hidden lg:block">
            <div className="veltrix-animate-float rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm veltrix-glow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Deploy</div>
                  <div className="text-[10px] text-muted-foreground">Ready in 8s</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-4 bottom-1/4 hidden lg:block">
            <div className="veltrix-animate-float rounded-xl border border-border/60 bg-card/80 p-3 backdrop-blur-sm veltrix-glow-sm" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-veltrix-indigo/20">
                  <Shield className="h-4 w-4 text-veltrix-indigo" />
                </div>
                <div>
                  <div className="text-xs font-semibold">SSL auto</div>
                  <div className="text-[10px] text-muted-foreground">HTTPS on</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
