"use client";

import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VeltrixMark } from "@/components/veltrix/shared/VeltrixLogo";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export function AuthModal() {
  const { authModalOpen, authModalMode, closeAuth, openAuth, setUser, setView } = useAppStore();
  const [busy, setBusy] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Reset state
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetStage, setResetStage] = useState<"request" | "apply" | "done">("request");
  const [devToken, setDevToken] = useState<string | null>(null);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
      closeAuth();
      setView("dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Signup failed");
        return;
      }
      setUser(data.user);
      toast.success(`Welcome to VELTRIX, ${data.user.name || data.user.email}!`);
      closeAuth();
      setView("dashboard");
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const onResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.devToken) {
        setDevToken(data.devToken);
        toast.info(data.devNote || "Reset token generated for local testing.");
      } else {
        toast.success("If an account exists for that email, a reset link has been sent.");
      }
      setResetStage("apply");
    } finally {
      setBusy(false);
    }
  };

  const onResetApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken || devToken || "",
          password: resetPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Reset failed");
        return;
      }
      toast.success("Password updated. You can sign in now.");
      setResetStage("done");
      setResetToken("");
      setResetPassword("");
      setDevToken(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="sm:max-w-md">
        {authModalMode === "reset" ? (
          <>
            <DialogHeader>
              <div className="mb-2 flex justify-center">
                <VeltrixMark size={48} />
              </div>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>
                {resetStage === "request" && "Enter your email and we'll send a reset link."}
                {resetStage === "apply" && "Enter the reset token and your new password."}
                {resetStage === "done" && "Your password has been updated."}
              </DialogDescription>
            </DialogHeader>

            {resetStage === "request" && (
              <form onSubmit={onResetRequest} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full veltrix-bg-gradient text-white">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}

            {resetStage === "apply" && (
              <form onSubmit={onResetApply} className="space-y-3">
                {devToken && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <p className="font-semibold">Dev mode (no email server configured)</p>
                    <p className="mt-1 break-all">Token: <code className="font-mono">{devToken}</code></p>
                    <p className="mt-1">Token pre-filled in the field below — just set a new password.</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-token">Reset token</Label>
                  <Input
                    id="reset-token"
                    required
                    value={resetToken || devToken || ""}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste your reset token"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reset-password">New password (min 8 chars)</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    required
                    minLength={8}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full veltrix-bg-gradient text-white">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            )}

            {resetStage === "done" && (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
                <Button
                  onClick={() => openAuth("login")}
                  className="w-full veltrix-bg-gradient text-white"
                >
                  Back to sign in
                </Button>
              </div>
            )}

            <button
              onClick={() => openAuth("login")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          </>
        ) : (
          <Tabs value={authModalMode} onValueChange={(v) => openAuth(v as any)}>
            <DialogHeader>
              <div className="mb-2 flex justify-center">
                <VeltrixMark size={48} />
              </div>
              <DialogTitle className="text-center text-2xl">
                {authModalMode === "signup" ? "Create your account" : "Welcome back"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {authModalMode === "signup"
                  ? "Free forever. No credit card required."
                  : "Sign in to manage your websites."}
              </DialogDescription>
            </DialogHeader>

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" onClick={() => openAuth("login")}>
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={() => openAuth("signup")}>
                Sign up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => openAuth("reset")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full veltrix-bg-gradient text-white">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password (min 8 chars)</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full veltrix-bg-gradient text-white">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By signing up you agree to use Veltrix responsibly. The first account created becomes the admin.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
