import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <Logo />
        <p className="max-w-md text-sm text-muted-foreground">
          Vulnera is a monitoring aid and does not replace professional medical advice.
        </p>
        <p className="text-sm text-muted-foreground">© Vulnera {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
