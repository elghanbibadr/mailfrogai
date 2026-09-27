import { cn } from "@/lib/utils";

/**
 * Visualizes the product itself: a stack of generic draft cards behind,
 * one personalized email in front — fed by a few input signals (name,
 * company, role). Not a stock envelope/sparkle icon; it's literally
 * "raw inputs become one specific email," which is what MailForge does.
 */
export function AuthIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full max-w-sm", className)}
      aria-hidden
    >
      <defs>
        <filter id="mf-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>

      {/* ambient glow behind the composition */}
      <circle cx="210" cy="195" r="130" className="fill-primary/10" filter="url(#mf-glow)" />

      {/* input signals converging into the card */}
      <g strokeWidth="1.5" fill="none">
        <path d="M62,48 C118,78 152,102 178,132" className="stroke-border" />
        <path d="M352,58 C300,90 266,112 244,132" className="stroke-border" />
        <path d="M210,20 C210,58 210,90 210,124" className="stroke-primary/50" />
      </g>
      <circle cx="62" cy="48" r="5.5" className="fill-muted-foreground/40" />
      <circle cx="352" cy="58" r="5.5" className="fill-muted-foreground/40" />
      <circle cx="210" cy="20" r="5.5" className="fill-primary" />

      {/* two muted "generic draft" cards, stacked behind */}
      <rect
        x="48"
        y="140"
        width="224"
        height="134"
        rx="16"
        transform="rotate(-7 160 207)"
        className="fill-card stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="150"
        y="128"
        width="224"
        height="134"
        rx="16"
        transform="rotate(6 262 195)"
        className="fill-card stroke-border"
        strokeWidth="1.5"
        opacity="0.85"
      />

      {/* the personalized email, in front */}
      <g className="drop-shadow-[0_24px_48px_rgba(124,58,237,0.28)]">
        <rect x="83" y="150" width="252" height="182" rx="18" className="fill-card stroke-primary" strokeWidth="2" />

        {/* recipient row */}
        <circle cx="113" cy="180" r="12" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
        <rect x="136" y="174" width="72" height="6" rx="3" className="fill-foreground/70" />
        <rect x="136" y="185" width="46" height="5" rx="2.5" className="fill-muted-foreground/45" />

        {/* body lines */}
        <rect x="103" y="212" width="212" height="6" rx="3" className="fill-muted-foreground/30" />
        <rect x="103" y="226" width="190" height="6" rx="3" className="fill-muted-foreground/30" />
        <rect x="103" y="240" width="152" height="6" rx="3" className="fill-muted-foreground/30" />

        {/* the specific, personalized detail */}
        <rect x="103" y="260" width="118" height="16" rx="8" className="fill-primary/15 stroke-primary/40" strokeWidth="1" />

        {/* call to action */}
        <rect x="243" y="294" width="72" height="22" rx="11" className="fill-primary" />
        <rect x="257" y="303" width="44" height="4" rx="2" className="fill-primary-foreground/90" />
      </g>
    </svg>
  );
}
