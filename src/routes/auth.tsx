import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Vulnera" },
      { name: "description", content: "Sign in to your Vulnera account to see your wound status, alerts and healing history." },
      { property: "og:title", content: "Sign in to Vulnera" },
      { property: "og:description", content: "Your wound status, alerts and healing history in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

type Mode = "signin" | "signup";

const emailOk = (value: string) => /^\S+@\S+\.\S+$/.test(value);

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  // Someone already signed in has no business on this page.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) navigate({ to: "/app", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!emailOk(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        // Email confirmation is on, so no session yet — the user must click the link.
        if (data.session) {
          navigate({ to: "/app" });
          return;
        }
        setNeedsConfirm(true);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/app" });
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in didn't finish. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  }

  async function forgot() {
    if (!emailOk(email)) {
      toast.error("Type your email address above first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your inbox for a reset link.");
  }

  if (needsConfirm) {
    return (
      <Shell>
        <div role="status" className="rounded-2xl bg-healthy-soft p-5 text-sm">
          <p className="font-semibold text-foreground">Confirm your email to finish signing up</p>
          <p className="mt-1 text-foreground/80">
            We sent a link to <span className="font-medium">{email}</span>. Open it, then come back and sign in.
          </p>
        </div>
        <Button className="mt-4 w-full rounded-full" onClick={() => setNeedsConfirm(false)}>
          Back to sign in
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1" role="tablist" aria-label="Account">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors " +
              (mode === m ? "bg-background text-foreground shadow-soft" : "text-muted-foreground")
            }
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Your name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              autoComplete="name"
              className="h-11 rounded-xl"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-11 rounded-xl"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="h-11 rounded-xl"
          />
        </div>

        <Button type="submit" disabled={busy} className="h-11 w-full rounded-full">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      {mode === "signin" && (
        <button
          type="button"
          onClick={forgot}
          className="mt-3 w-full text-center text-sm font-medium text-primary hover:underline"
        >
          Forgot your password?
        </button>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onClick={google} />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="font-medium text-primary hover:underline">
          Back to vulnera
        </Link>
        {" · "}
        <Link to="/demo" className="font-medium text-primary hover:underline">
          Try the demo first
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-hero px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" aria-label="Vulnera home" className="inline-flex">
          <Logo />
        </Link>
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">{children}</div>
      </div>
    </div>
  );
}

/** Google's branding rules: their four-colour mark, white background, grey border. */
function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="h-11 w-full rounded-full border bg-white px-3 text-[#1F1F1F] hover:bg-[#F2F2F2]"
      style={{ borderColor: "#747775" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={18}
        height={18}
        aria-hidden="true"
        style={{ marginLeft: 0, marginRight: 10 }}
      >
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
