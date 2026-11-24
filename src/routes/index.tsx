import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BellRing, CheckCircle2, Cpu, EyeOff, HeartPulse,
  Hospital, Home, Radio, ShieldCheck, Stethoscope, Thermometer, Droplets, UserRound, Smile,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vulnera — Catch infection early. Heal with confidence." },
      { name: "description", content: "Vulnera is a smart bandage that monitors your wound in real time and alerts you before complications like sepsis develop." },
      { property: "og:title", content: "Vulnera — Catch infection early. Heal with confidence." },
      { property: "og:description", content: "A smart bandage that monitors wound healing in real time and alerts you before complications develop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setSeen(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function CountUp({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const { ref, seen } = useInView<HTMLSpanElement>();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1600);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref}>{prefix}{v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

function Index() {
  return (
    <div id="top" className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Gap />
        <How />
        <Who />
        <Financial />
        <Benefits />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-2 md:pb-28 md:pt-24">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-healthy" aria-hidden="true" /> Smart wound monitoring
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
            Catch infection early. <span className="text-primary">Heal with confidence.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Vulnera is a smart bandage that monitors your wound in real time and alerts you before complications develop.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link to="/demo">See the Demo <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
              <Link to="/" hash="waitlist">Join the Waitlist</Link>
            </Button>
          </div>
        </div>
        <div className="fade-up relative mx-auto w-full max-w-sm [animation-delay:150ms]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="relative grid size-16 place-items-center" role="status" aria-label="Wound status: Healthy">
                <span className="pulse-ring absolute inset-0 rounded-full bg-healthy/30" aria-hidden="true" />
                <span className="relative grid size-14 place-items-center rounded-full bg-healthy text-primary-foreground"><CheckCircle2 className="size-7" /></span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wound status</p>
                <p className="text-2xl font-bold">Healthy</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[{ i: Thermometer, l: "Temp", v: "33.4°" }, { i: Droplets, l: "pH", v: "6.6" }, { i: Activity, l: "Score", v: "86" }].map(({ i: I, l, v }) => (
                <div key={l} className="rounded-2xl bg-muted p-3">
                  <I className="size-4 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-xs text-muted-foreground">{l}</p>
                  <p className="font-bold">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-soft sm:flex sm:items-center sm:gap-3">
            <BellRing className="size-5 text-primary" aria-hidden="true" />
            <p className="text-sm font-medium">Monitoring 24/7</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionHead eyebrow="The problem" title="Sepsis is life-threatening — and time matters" text="Early recognition and treatment are critical to survival." />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <p className="text-5xl font-extrabold tracking-tight text-primary md:text-6xl">~<CountUp to={11} /> million</p>
          <p className="mt-3 text-lg text-muted-foreground">deaths a year worldwide are related to sepsis.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <p className="text-5xl font-extrabold tracking-tight text-primary md:text-6xl">~<CountUp to={20} suffix="%" /></p>
          <p className="mt-3 text-lg text-muted-foreground">of all global deaths are associated with sepsis.</p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Source: World Health Organization (WHO)</p>
    </section>
  );
}

function Gap() {
  return (
    <section className="bg-muted/60">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">The gap</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Recovery doesn't stop at discharge. Supervision does.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            After leaving the hospital, patients lose constant medical supervision. When monitoring relies only on visual checks, infections can progress unnoticed.
          </p>
        </div>
        <div className="grid gap-4">
          {[{ i: Hospital, t: "In hospital", d: "Continuous checks by medical staff" }, { i: Home, t: "At home", d: "Occasional visual checks by the patient" }, { i: EyeOff, t: "The risk", d: "Early signs of infection are easy to miss" }].map(({ i: I, t, d }) => (
            <div key={t} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><I className="size-5" aria-hidden="true" /></span>
              <div><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    { i: Radio, t: "Sensors track your wound", d: "Smart bandage sensors continuously track wound indicators like temperature, pH and moisture." },
    { i: Cpu, t: "Real-time analysis", d: "The data is analyzed in real time to detect early infection-related changes." },
    { i: BellRing, t: "Instant alert", d: "You get an instant alert in the Vulnera app and can contact medical staff quickly." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <SectionHead eyebrow="How Vulnera works" title="Three steps, always on" />
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map(({ i: I, t, d }, n) => (
          <li key={t} className="relative rounded-3xl border border-border bg-card p-7 shadow-soft transition-transform hover:-translate-y-1">
            <span className="absolute right-6 top-6 text-5xl font-extrabold text-accent" aria-hidden="true">{n + 1}</span>
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground"><I className="size-6" aria-hidden="true" /></span>
            <h3 className="mt-6 text-xl font-bold">{t}</h3>
            <p className="mt-2 text-muted-foreground">{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Who() {
  const who = [
    { i: HeartPulse, t: "Post-operative patients" },
    { i: AlertTriangle, t: "Trauma and injury patients" },
    { i: Home, t: "Rehabilitation & home recovery" },
    { i: Stethoscope, t: "Healthcare providers" },
  ];
  return (
    <section className="bg-muted/60">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHead eyebrow="Who it helps" title="Designed for every stage of recovery" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {who.map(({ i: I, t }) => (
            <div key={t} className="rounded-3xl border border-border bg-card p-6">
              <I className="size-7 text-primary" aria-hidden="true" />
              <p className="mt-4 font-semibold">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Financial() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid items-center gap-10 rounded-[2rem] bg-brand-gradient p-8 text-primary-foreground md:grid-cols-2 md:p-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Financial impact</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">One of the most expensive hospital conditions</h2>
          <p className="mt-4 text-lg opacity-90">
            Costs rise further with ICU care, longer stays and rehabilitation. Early detection can help reduce this burden on patients and healthcare systems.
          </p>
        </div>
        <div className="rounded-3xl bg-background/15 p-8 backdrop-blur">
          <p className="text-5xl font-extrabold md:text-6xl"><CountUp to={21700} prefix="$" /></p>
          <p className="mt-3 opacity-90">average cost of a sepsis hospitalization in the US (2021)</p>
          <p className="mt-4 text-xs opacity-70">Source: AHRQ</p>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const b = [
    { i: Activity, t: "Continuous monitoring", d: "Instead of visual-only checks." },
    { i: UserRound, t: "Earlier medical contact", d: "Reach your care team at the first signs." },
    { i: ShieldCheck, t: "Lower risk", d: "Of unnoticed infection progression." },
    { i: Smile, t: "Peace of mind", d: "Greater awareness of how you're healing." },
  ];
  return (
    <section className="bg-muted/60">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <SectionHead eyebrow="Benefits" title="Reassurance, between every check-up" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {b.map(({ i: I, t, d }) => (
            <div key={t} className="flex gap-4 rounded-3xl border border-border bg-card p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-healthy-soft text-healthy"><I className="size-5" aria-hidden="true" /></span>
              <div><p className="font-semibold">{t}</p><p className="text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Please enter a valid email address."); return; }
    setDone(true);
    toast.success("You're on the list!");
  };
  return (
    <section id="waitlist" className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
      <SectionHead eyebrow="Waitlist" title="Be the first to try Vulnera" text="Join the waitlist for early access and launch updates." />
      {done ? (
        <div role="status" className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 rounded-2xl bg-healthy-soft p-5 font-medium text-foreground">
          <CheckCircle2 className="size-5 text-healthy" aria-hidden="true" /> Thanks! We'll be in touch at {email}.
        </div>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="email" className="sr-only">Email address</label>
          <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-full px-5" />
          <Button type="submit" size="lg" className="h-12 rounded-full px-7">Join</Button>
        </form>
      )}
    </section>
  );
}
