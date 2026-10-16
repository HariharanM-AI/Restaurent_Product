/**
 * Ambient backdrop for glass surfaces: drifting brand-coloured light,
 * faint angular "shards" and film grain. Purely decorative.
 */
export function Ambient({
  variant = "admin",
  tint = "#14B8A6",
  tintDeep = "#0F766E",
}: {
  variant?: "admin" | "auth" | "marketing" | "guest";
  /** Any CSS colour, e.g. a restaurant brand var(--brand-primary) */
  tint?: string;
  tintDeep?: string;
}) {
  return (
    <div className="ambient" aria-hidden="true">
      <div
        className="ambient-orb hidden sm:block"
        style={{ width: 500, height: 500, top: "-15%", right: "-5%", background: tint, opacity: 0.2 }}
      />
      <div
        className="ambient-orb hidden sm:block"
        style={{ width: 450, height: 450, bottom: "-18%", left: "-10%", background: tintDeep, animationDelay: "-9s", opacity: 0.15 }}
      />
      <div
        className="ambient-orb"
        style={{
          width: 380,
          height: 380,
          top: variant === "marketing" ? "40%" : "48%",
          left: "42%",
          background: "#F59E0B",
          opacity: 0.18,
          animationDelay: "-17s",
        }}
      />
      <svg className="ambient-shards" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="shard-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="shard-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.045" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="url(#shard-fill)" stroke="url(#shard-edge)" strokeWidth="1.2">
          <polygon points="980,-40 1300,120 1180,420 900,260" />
          <polygon points="1240,380 1500,300 1520,640 1300,700" />
          <polygon points="120,560 420,470 520,760 180,900" />
          <polygon points="-60,80 220,10 300,260 40,330" />
          <polygon points="620,720 900,640 980,940 640,980" />
          <polygon points="560,-60 760,40 700,200 500,140" />
        </g>
        <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
          <line x1="0" y1="640" x2="1440" y2="180" />
          <line x1="200" y1="900" x2="1440" y2="420" />
        </g>
      </svg>
      <div className="grain absolute inset-0" />
    </div>
  );
}
