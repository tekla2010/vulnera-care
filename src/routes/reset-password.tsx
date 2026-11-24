import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Vulnera" },
      { name: "description", content: "Set a new password for your Vulnera account." },
      { property: "og:title", content: "Choose a new password — Vulnera" },
      { property: "og:description", content: "Set a new password for your Vulnera account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // The reset link lands here with a recovery session in the URL fragment.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    // Recovery sessions are exempt from the current-password requirement.
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-hero px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" aria-label="Vulnera home" className="inline-flex">
          <Logo />
        </Link>
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          {ready ? (
            <form onSubmit={submit} className="space-y-3">
              <h1 className="text-lg font-bold">Choose a new password</h1>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                New password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-11 rounded-xl"
              />
              <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">
                {busy ? "Saving…" : "Save new password"}
              </Button>
            </form>
          ) : (
            <div>
              <h1 className="text-lg font-bold">Open your reset link</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This page only works when you arrive from the reset link in your email. If the link
                expired, request a new one from the sign-in page.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full rounded-full">
                <Link to="/auth">Go to sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
