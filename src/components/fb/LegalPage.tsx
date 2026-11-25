import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import icon from "@/assets/icon-fieldbridge-projects.jpg";
import { BetaBadge, LegalLinks } from "./Beta";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-primary bg-shell text-shell-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Link to="/home" className="flex items-center gap-2">
            <img src={icon} alt="FieldBridge Projects logo" width={28} height={28} className="h-7 w-7 rounded-sm" />
            <span className="font-display text-lg font-bold uppercase">FieldBridge <span className="text-primary">Projects</span></span>
          </Link>
          <BetaBadge />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold uppercase">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:uppercase [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:underline">{children}</div>
      </main>
      <footer className="bg-shell py-6 text-shell-muted"><LegalLinks /><p className="mt-2 text-center text-xs">© 2026 FieldBridge Projects · part of FieldBridge</p></footer>
    </div>
  );
}
