import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { label: "Home", to: "/", hash: "top" },
  { label: "How it works", to: "/", hash: "how" },
  { label: "Demo", to: "/demo", hash: undefined },
  { label: "Waitlist", to: "/", hash: "waitlist" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" hash="top" aria-label="Vulnera home"><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {items.map((i) => (
            <Link key={i.label} to={i.to} {...(i.hash ? { hash: i.hash } : {})} className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {i.label}
            </Link>
          ))}
          {user ? (
            <>
              <Button asChild size="sm" className="ml-2 rounded-full">
                <Link to="/app">Open my wound</Link>
              </Button>
              <Button size="sm" variant="outline" className="ml-1 rounded-full" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="outline" className="ml-2 rounded-full">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="ml-1 rounded-full">
                <Link to="/" hash="waitlist">Join the Waitlist</Link>
              </Button>
            </>
          )}
        </nav>
        <button className="rounded-lg p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-border bg-background px-5 py-3 md:hidden">
          {items.map((i) => (
            <Link key={i.label} to={i.to} {...(i.hash ? { hash: i.hash } : {})} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-medium text-foreground hover:bg-accent">
              {i.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/app" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-medium text-primary hover:bg-accent">
                Open my wound
              </Link>
              <button onClick={signOut} className="block w-full rounded-lg px-3 py-3 text-left font-medium text-foreground hover:bg-accent">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-medium text-primary hover:bg-accent">
                Sign in
              </Link>
              <Link to="/" hash="waitlist" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-medium text-foreground hover:bg-accent">
                Join the Waitlist
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
