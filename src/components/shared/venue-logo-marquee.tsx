import { Coffee, Croissant, Flame, Leaf, Martini, Pizza, Soup, UtensilsCrossed, Wine, Fish } from "lucide-react";

/* Venue categories the product is built for — wordmark-style, not real brands */
const VENUES = [
  { name: "Cafés", icon: Coffee },
  { name: "Bakeries", icon: Croissant },
  { name: "Grill houses", icon: Flame },
  { name: "Plant-based kitchens", icon: Leaf },
  { name: "Cocktail bars", icon: Martini },
  { name: "Pizzerias", icon: Pizza },
  { name: "Noodle bars", icon: Soup },
  { name: "Fine dining", icon: UtensilsCrossed },
  { name: "Wine bars", icon: Wine },
  { name: "Seafood houses", icon: Fish },
];

function Row({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-3 pr-3 motion-safe:animate-[marquee_38s_linear_infinite] group-hover:[animation-play-state:paused]" aria-hidden={hidden}>
      {VENUES.map(({ name, icon: Icon }) => (
        <li
          key={name}
          className="flex items-center gap-2.5 whitespace-nowrap rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold tracking-tight text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur"
        >
          <Icon className="h-4 w-4 text-teal-700" strokeWidth={2} />
          {name}
        </li>
      ))}
    </ul>
  );
}

export function VenueLogoMarquee() {
  return (
    <section aria-label="Venues Noura is built for" className="w-full max-w-6xl py-12">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        Built for every kind of venue
      </p>
      <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <Row />
        <Row hidden />
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-100%); } }`}</style>
    </section>
  );
}
