export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-bold tracking-tight text-foreground">
      <span className="grid size-8 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-soft" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 3c3.5 4.2 6 7.4 6 10.5A6 6 0 0 1 6 13.5C6 10.4 8.5 7.2 12 3Z" />
          <path d="M12 11v5M9.5 13.5h5" />
        </svg>
      </span>
      <span className="text-lg">Vulnera</span>
    </span>
  );
}
