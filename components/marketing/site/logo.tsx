import Link from "next/link";
import { Leaf } from "lucide-react";
import { CLINIC } from "@/lib/marketing/clinic";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={CLINIC.name}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          inverted ? "bg-cream text-forest" : "bg-forest text-cream"
        }`}
      >
        <Leaf className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif text-lg font-semibold tracking-tight ${
            inverted ? "text-cream" : "text-ink"
          }`}
        >
          Essencial
        </span>
        <span
          className={`text-[0.62rem] font-medium tracking-[0.28em] uppercase ${
            inverted ? "text-cream/70" : "text-forest"
          }`}
        >
          Centro
        </span>
      </span>
    </Link>
  );
}
