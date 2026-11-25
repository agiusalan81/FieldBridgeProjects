import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function BetaBadge() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label="About the beta" className="rounded-sm border border-primary px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase leading-none text-primary hover:bg-primary hover:text-primary-foreground">Beta</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>FieldBridge Projects is in beta</DialogTitle>
          <DialogDescription>We're actively improving the app with site teams. Features may change, and your feedback shapes what we build next.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Keep your own copies of contractual records during the beta. FieldBridge Projects helps with record-keeping but does not replace professional or engineering judgement.</p>
        <LegalLinks />
      </DialogContent>
    </Dialog>
  );
}

export function LegalLinks({ className = "" }: { className?: string }) {
  const l = "underline-offset-2 hover:underline";
  return (
    <nav aria-label="Legal" className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs ${className}`}>
      <Link to="/terms" className={l}>Terms</Link>
      <Link to="/privacy" className={l}>Privacy</Link>
      <Link to="/security" className={l}>Security</Link>
      <Link to="/accessibility" className={l}>Accessibility</Link>
    </nav>
  );
}
