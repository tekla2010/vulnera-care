import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const items = [
  { label: "Home", to: "/", hash: "top" },
  { label: "How it works", to: "/", hash: "how" },
  { label: "Demo", to: "/demo", hash: undefined },
  { label: "Waitlist", to: "/", hash: "waitlist" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
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
          <Button asChild size="sm" className="ml-2 rounded-full">
            <Link to="/" hash="waitlist">Join the Waitlist</Link>
          </Button>
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
        </nav>
      )}
    </header>
  );
}
