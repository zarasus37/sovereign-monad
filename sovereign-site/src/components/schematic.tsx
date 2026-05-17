type LoopGlyphProps = {
  color: "gold" | "cyan" | "silver";
};

const toneMap = {
  gold: {
    stroke: "#C9A84C",
    fill: "rgba(201, 168, 76, 0.14)"
  },
  cyan: {
    stroke: "#00D4FF",
    fill: "rgba(0, 212, 255, 0.14)"
  },
  silver: {
    stroke: "#d9d9d9",
    fill: "rgba(255, 255, 255, 0.08)"
  }
} as const;

export function HeroSigil() {
  return (
    <svg
      viewBox="0 0 640 640"
      className="hero-sigil"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201, 168, 76, 0.26)" />
          <stop offset="60%" stopColor="rgba(201, 168, 76, 0.08)" />
          <stop offset="100%" stopColor="rgba(201, 168, 76, 0)" />
        </radialGradient>
      </defs>
      <rect x="24" y="24" width="592" height="592" className="sigil-frame" />
      <circle cx="320" cy="320" r="240" className="sigil-cyan soft" />
      <circle cx="320" cy="320" r="210" className="sigil-cyan" />
      <circle cx="320" cy="320" r="180" className="sigil-cyan soft" />
      <circle cx="320" cy="320" r="150" className="sigil-cyan" />
      <circle cx="320" cy="320" r="118" className="sigil-gold" />
      <polygon points="320,78 474,167 474,344 320,433 166,344 166,167" className="sigil-gold" />
      <polygon points="320,122 435,188 435,320 320,386 205,320 205,188" className="sigil-gold soft" />
      <polygon points="320,178 385,216 385,292 320,330 255,292 255,216" className="sigil-gold" />
      <path d="M320 52V588M52 320H588M118 118L522 522M522 118L118 522" className="sigil-axis" />
      <path d="M320 118C268 214 214 268 118 320C214 372 268 426 320 522C372 426 426 372 522 320C426 268 372 214 320 118Z" className="sigil-cyan soft" />
      <circle cx="320" cy="320" r="94" fill="url(#coreGlow)" />
    </svg>
  );
}

export function LoopGlyph({ color }: LoopGlyphProps) {
  const tone = toneMap[color];

  return (
    <svg viewBox="0 0 260 180" className="h-36 w-full" aria-hidden="true" role="presentation">
      <defs>
        <filter id={`glow-${color}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M42 92C42 57 70 32 104 32H115C149 32 177 57 177 92C177 127 149 152 115 152H104C70 152 42 127 42 92ZM145 88C145 53 173 28 207 28C241 28 246 53 246 88C246 123 241 148 207 148C173 148 145 123 145 88Z"
        fill={tone.fill}
        stroke={tone.stroke}
        strokeWidth="2.5"
        filter={`url(#glow-${color})`}
      />
      <path
        d="M66 92C66 70 84 52 106 52C128 52 146 70 146 92C146 114 128 132 106 132C84 132 66 114 66 92ZM170 88C170 66 186 48 206 48C226 48 242 66 242 88C242 110 226 128 206 128C186 128 170 110 170 88Z"
        fill="none"
        stroke={tone.stroke}
        strokeOpacity="0.8"
        strokeDasharray="6 8"
        strokeWidth="1.6"
      />
      <circle cx="130" cy="90" r="16" fill="rgba(255,255,255,0.05)" stroke="#FFFFFF" strokeOpacity="0.16" />
      <path d="M130 78V102M118 90H142" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2" />
    </svg>
  );
}

export function AgentMatrixGlyph() {
  return (
    <svg viewBox="0 0 320 180" className="w-full" aria-hidden="true" role="presentation">
      <rect x="20" y="18" width="280" height="144" className="matrix-frame" />
      <path d="M40 50H140L175 90L140 130H40" className="matrix-gold" />
      <path d="M180 50H282V130H180" className="matrix-cyan" />
      <path d="M140 50H180V130H140" className="matrix-connector" />
      <path d="M160 42V138M40 90H282" className="matrix-axis" />
      <circle cx="160" cy="90" r="20" className="matrix-core" />
    </svg>
  );
}
