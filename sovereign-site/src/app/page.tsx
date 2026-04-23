import { AgentMatrixGlyph, HeroSigil, LoopGlyph } from "@/components/schematic";

const proofRecords = [
  {
    label: "Revenue Router",
    value: "0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982",
    href: "https://monadscan.com/address/0x39158bC2cfCa2cCF70121EF72ed9a5fF1e084982"
  },
  {
    label: "EmergenceRecorder",
    value: "0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84",
    href: "https://monadscan.com/address/0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84"
  },
  {
    label: "Agent 0 - Genesis Registration",
    value: "0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced",
    href: "https://monadscan.com/tx/0xf68419e554a2afa0b30ab78e65671e13b388da1f00ddc77638f262886aeb9ced"
  },
  {
    label: "Live Behavioral Claim",
    value: "0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef",
    href: "https://monadscan.com/tx/0x70f14e03934e15b1c51a99a8f82cf75764c42807468a56e9e01889b093154fef"
  }
] as const;

const loops = [
  {
    title: "Capital Loop",
    subtitle: "Self-funding through aligned extraction.",
    sequence: "Funding -> Revenue Router -> MEV -> Treasury",
    color: "gold" as const
  },
  {
    title: "Intelligence Loop",
    subtitle: "Compounding behavioral knowledge.",
    sequence: "Signal -> Capture -> Structure -> Model Update",
    color: "cyan" as const
  },
  {
    title: "Integrity Loop",
    subtitle: "Moral alignment and drift detection.",
    sequence: "Behavior -> Axiom Measurement -> Dove Signal -> Governance",
    color: "silver" as const
  }
] as const;

const blueprintTiers = [
  {
    title: "Foundation (Layers 1-4)",
    items: ["Funnel", "MEV Engine", "Treasury", "DAO"],
    tone: "border-[rgba(201,168,76,0.36)] text-[#C9A84C]"
  },
  {
    title: "Cognition (Layers 5-8)",
    items: ["Intelligence", "Oracle", "Signal", "Platform"],
    tone: "border-[rgba(0,212,255,0.34)] text-[#8beaff]"
  },
  {
    title: "Identity & Conscience (Layers 9-12)",
    items: ["Keys", "Narrative", "Dove", "Gnosis"],
    tone: "border-[rgba(255,255,255,0.22)] text-white"
  },
  {
    title: "Evolution (Layers 13-15)",
    items: ["Revenue Router", "Data Rail", "Emergent Protocol"],
    tone: "border-[rgba(201,168,76,0.3)] text-[#f0d27d]"
  }
] as const;

export default function Home() {
  return (
    <main className="page-shell bg-sovereign-bg text-sovereign-text">
      <div className="section-grid absolute inset-0 opacity-60" aria-hidden="true" />

      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-12 sm:px-8 lg:px-10">
        <div className="drift-lines absolute inset-0 opacity-40" aria-hidden="true">
          <div className="absolute inset-x-0 top-[12%] h-px bg-[rgba(160,160,160,0.12)]" />
          <div className="absolute inset-x-0 top-[52%] h-px bg-[rgba(160,160,160,0.08)]" />
          <div className="absolute inset-y-0 left-[18%] w-px bg-[rgba(160,160,160,0.08)]" />
          <div className="absolute inset-y-0 right-[18%] w-px bg-[rgba(160,160,160,0.08)]" />
        </div>

        <div className="absolute right-6 top-6 z-10 hidden border border-[rgba(160,160,160,0.22)] bg-[rgba(8,8,8,0.88)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.62)] lg:block">
          <div>[STATUS: LIVE MAINNET]</div>
          <div>[CHAIN: 143]</div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center justify-center text-center">
          <div className="hero-reveal hero-delay-1 mb-6 inline-flex items-center gap-3 border border-[rgba(0,212,255,0.2)] bg-[rgba(8,8,8,0.82)] px-4 py-2">
            <span className="schematic-label text-[11px] text-[rgba(0,212,255,0.76)]">
              [[DOCTRINE SYNC]]
            </span>
            <span className="h-1 w-1 rounded-full bg-[#55e5a2]" />
            <span className="font-mono text-xs text-[rgba(255,255,255,0.58)]">
              LIVE STATE VERIFIED ON MONAD MAINNET
            </span>
          </div>

          <div className="pulse-core hero-reveal hero-delay-2 pointer-events-none absolute inset-x-0 top-[10%] mx-auto flex justify-center opacity-90">
            <HeroSigil />
          </div>

          <div className="relative pt-12 sm:pt-16 lg:pt-20">
            <p className="hero-reveal hero-delay-1 schematic-label mb-4 text-xs text-[rgba(0,212,255,0.62)] sm:text-sm">
              SOVEREIGN MONAD ECOSYSTEM
            </p>
            <h1 className="hero-reveal hero-delay-2 text-balance text-[clamp(3.8rem,10vw,8.8rem)] font-medium uppercase leading-[0.92] tracking-[-0.06em] text-white">
              Sovereign Monad
            </h1>
            <p className="hero-reveal hero-delay-2 mt-5 text-balance text-[clamp(1.35rem,3vw,2.5rem)] font-light tracking-[-0.04em] text-[#f5f2e7]">
              Anatomy of an AI-Native Economic Organism.
            </p>
            <p className="hero-reveal hero-delay-3 mx-auto mt-6 max-w-3xl text-balance text-base leading-8 text-sovereign-muted sm:text-lg">
              Where execution, identity, and intelligence do not cancel each other out.
            </p>
          </div>

          <div className="hero-reveal hero-delay-3 relative mt-10 flex flex-col gap-4 sm:flex-row">
            <ActionLink
              href="https://github.com/zarasus37/sovereign-monad"
              label="View on GitHub"
              tone="gold"
            />
            <ActionLink
              href="https://monadscan.com/address/0x6692a350f4b74Ae6855E633aD99eEC1cf80e5d84"
              label="MonadScan"
              tone="cyan"
            />
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-8 pt-6 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1380px]">
          <SectionHeading
            eyebrow="[[LIVE_PROOF: MAINNET]]"
            title="Live on Monad Mainnet"
            description="Four live records anchor the current public state: the Revenue Router, the EmergenceRecorder, Agent 0 genesis registration, and the first recorded behavioral claim."
          />

          <div className="frame-panel gold-frame scanline mt-8 overflow-hidden px-4 py-5 sm:px-8 sm:py-7">
            <div className="grid gap-4 border-b border-[rgba(201,168,76,0.18)] pb-5 sm:grid-cols-[1.2fr_2.4fr_auto] sm:items-end">
              <div className="schematic-label text-[11px] text-[rgba(201,168,76,0.78)]">
                [MONAD MAINNET RECORDS]
              </div>
              <div className="hidden font-mono text-[11px] text-[rgba(255,255,255,0.46)] sm:block">
                ADDRESS / TRANSACTION
              </div>
              <div className="hidden justify-self-end font-mono text-[11px] text-[rgba(255,255,255,0.46)] sm:block">
                ACTION
              </div>
            </div>

            <div className="divide-y divide-[rgba(160,160,160,0.1)]">
              {proofRecords.map((record) => (
                <article
                  key={record.value}
                  className="grid gap-4 py-5 sm:grid-cols-[1.2fr_2.4fr_auto] sm:items-center"
                >
                  <div>
                    <h3 className="text-sm uppercase tracking-[0.14em] text-white/90">
                      {record.label}
                    </h3>
                  </div>
                  <a
                    href={record.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm leading-6 text-[#d7eef3] transition-colors duration-200 hover:text-white break-all"
                  >
                    {record.value}
                  </a>
                  <div className="justify-self-start sm:justify-self-end">
                    <a
                      href={record.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border border-[rgba(0,212,255,0.18)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(0,212,255,0.78)] transition-all duration-200 hover:border-[rgba(0,212,255,0.4)] hover:text-white"
                    >
                      View on MonadScan
                      <span aria-hidden="true">-&gt;</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(201,168,76,0.18)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="schematic-label text-[11px] text-[rgba(255,255,255,0.52)]">
                [CHAIN: MONAD MAINNET - CHAIN ID 143]
              </div>
              <div className="font-mono text-xs text-[rgba(85,229,162,0.88)]">
                STATUS: LIVE / QUERYABLE / PERMANENT STORAGE
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1380px] gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="frame-panel cyan-frame px-6 py-6 sm:px-8 sm:py-8">
            <p className="schematic-label text-[11px] text-[rgba(0,212,255,0.72)]">
              [[SYSTEM_DEFINITION]]
            </p>
            <h2 className="mt-5 max-w-md text-balance text-[clamp(2.4rem,4.5vw,4.25rem)] font-medium leading-[0.95] tracking-[-0.05em] text-white">
              Not a tool. An Organism.
            </h2>
          </div>

          <div className="frame-panel px-6 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_12rem]">
              <div className="space-y-6 text-balance text-base leading-8 text-[rgba(255,255,255,0.76)] sm:text-lg">
                <p>
                  Sovereign Monad is a self-sustaining AI-native economic organism built exclusively on Monad. Every participant enters through a validated psychometric assessment. Their Big Five personality profile is encoded into an AI agent that operates autonomously inside the ecosystem - trading, researching, coordinating, and generating behavioral data that reflects how their specific psychological makeup responds to real market pressure.
                </p>
                <p>
                  Monad is not a deployment choice. It is a structural requirement. The ecosystem runs thousands of personality-distinct agents simultaneously executing micro-transactions, updating state, and routing capital in real time. Monad&apos;s parallel execution, sub-second finality, and low-fee micro-action viability are the physical infrastructure the organism requires to breathe.
                </p>
              </div>

              <div className="hidden lg:block">
                <AgentMatrixGlyph />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1380px]">
          <SectionHeading
            eyebrow="[[CORE_DYNAMICS]]"
            title="The Dynamics of Life"
            description="Three master loops keep the organism viable. Capital keeps it running. Intelligence compounds what it learns. Integrity prevents drift from breaking the structure that makes the other two valuable."
          />

          <div className="frame-panel mt-8 overflow-hidden px-4 py-6 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-3 lg:divide-x lg:divide-[rgba(160,160,160,0.1)]">
              {loops.map((loop) => (
                <div key={loop.title} className="px-2 py-2 lg:px-6">
                  <LoopGlyph color={loop.color} />
                  <div className="mt-4 space-y-3">
                    <h3 className="text-2xl font-medium tracking-[-0.04em] text-white">
                      {loop.title}
                    </h3>
                    <p className="text-sm uppercase tracking-[0.18em] text-sovereign-muted">
                      {loop.subtitle}
                    </p>
                    <p className="max-w-sm font-mono text-sm leading-7 text-[rgba(255,255,255,0.74)]">
                      {loop.sequence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1380px]">
          <SectionHeading
            eyebrow="[[SOVEREIGN_BLUEPRINT]]"
            title="The Sovereign Blueprint"
            description="The public site compresses the deeper 15-layer stratigraphy into four readable operational bands. The sequence still holds: capital enters, intelligence acts, conscience evaluates, evolution compounds."
          />

          <div className="frame-panel mt-8 px-4 py-6 sm:px-8 sm:py-8">
            <div className="space-y-4">
              {blueprintTiers.map((tier, index) => (
                <div
                  key={tier.title}
                  className={`grid gap-4 border bg-[rgba(10,10,10,0.78)] px-4 py-5 sm:px-6 lg:grid-cols-[0.9fr_1.8fr] ${tier.tone}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="schematic-label text-[11px] text-[rgba(255,255,255,0.42)]">
                      [{String(index + 1).padStart(2, "0")}]
                    </div>
                    <h3 className="text-xl font-medium tracking-[-0.03em]">{tier.title}</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {tier.items.map((item) => (
                      <div
                        key={item}
                        className="border border-[rgba(160,160,160,0.12)] px-4 py-4 font-mono text-sm text-white/82"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1380px]">
          <SectionHeading
            eyebrow="[[AGENT_0_GENESIS]]"
            title="Agent 0 - The First Psychometric Profile on Monad Mainnet"
            description="The first registered agent is the founder profile itself, written into EmergenceRecorder with live routing and live behavioral proof rather than a simulation-only artifact."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="frame-panel gold-frame px-6 py-6 sm:px-8 sm:py-8">
              <p className="max-w-3xl text-balance text-base leading-8 text-[rgba(255,255,255,0.76)] sm:text-lg">
                The founder&apos;s Big Five personality profile - encoded as 8 on-chain values - became the first registered agent in the EmergenceRecorder. Primary domain: TRADING. Secondary: GOVERNANCE. Tertiary: DOCTRINE. Dove monitoring: Active.
              </p>

              <dl className="mt-8 space-y-5">
                <ProofField
                  label="Agent ID"
                  value="0x995e680959d8547e69ad905c9da415dd9c0dc542e83946da7c5571a6cf19184d"
                />
                <ProofField label="On-chain scores" value="[74, 55, 43, 19, 12, 78, 70, 50]" />
                <ProofField
                  label="Decision hash"
                  value="0xdaf2930d50b1c6c2c6e23ce12d51b3a5b8a972c1ccbab355d58078811469adf4"
                />
              </dl>
            </div>

            <div className="frame-panel cyan-frame px-6 py-6 sm:px-8 sm:py-8">
              <div className="mb-6">
                <p className="schematic-label text-[11px] text-[rgba(0,212,255,0.74)]">
                  [[ROUTING_MATRIX]]
                </p>
              </div>
              <div className="grid gap-4">
                <DomainChip label="Primary Domain" value="TRADING" tone="gold" />
                <DomainChip label="Secondary Domain" value="GOVERNANCE" tone="cyan" />
                <DomainChip label="Tertiary Domain" value="DOCTRINE" tone="neutral" />
                <DomainChip label="Dove Monitoring" value="ACTIVE" tone="alert" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative px-5 pb-12 pt-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1380px] border-t border-[rgba(160,160,160,0.14)] pt-8">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-balance text-2xl tracking-[-0.04em] text-white">
                Building on Monad. Applying to AI Blueprint.
              </p>
            </div>

            <div className="grid gap-3 font-mono text-sm text-[rgba(255,255,255,0.68)] sm:grid-cols-2">
              <a href="mailto:criscolon37@gmail.com" className="transition-colors hover:text-white">
                criscolon37@gmail.com
              </a>
              <a
                href="https://github.com/zarasus37/sovereign-monad"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white"
              >
                github.com/zarasus37/sovereign-monad
              </a>
              <span>Chain ID: 143 - Monad Mainnet</span>
              <span>Copyright: Sovereign Monad Ecosystem 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="max-w-4xl">
      <p className="schematic-label text-[11px] text-[rgba(0,212,255,0.72)]">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-[clamp(2.3rem,4vw,4.3rem)] font-medium leading-[0.95] tracking-[-0.05em] text-white">
        {title}
      </h2>
      <p className="mt-5 max-w-3xl text-balance text-base leading-8 text-sovereign-muted sm:text-lg">
        {description}
      </p>
    </header>
  );
}

function ActionLink({
  href,
  label,
  tone
}: {
  href: string;
  label: string;
  tone: "gold" | "cyan";
}) {
  const styles =
    tone === "gold"
      ? "border-[rgba(201,168,76,0.34)] bg-[rgba(201,168,76,0.08)] text-[#f3dd9f] hover:border-[rgba(201,168,76,0.56)] hover:text-white"
      : "border-[rgba(0,212,255,0.28)] bg-[rgba(0,212,255,0.06)] text-[#93efff] hover:border-[rgba(0,212,255,0.54)] hover:text-white";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-3 border px-5 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-all duration-200 ${styles}`}
    >
      {label}
      <span aria-hidden="true">-&gt;</span>
    </a>
  );
}

function ProofField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[rgba(160,160,160,0.12)] px-4 py-4">
      <dt className="schematic-label text-[11px] text-[rgba(0,212,255,0.62)]">{label}</dt>
      <dd className="mt-2 break-all font-mono text-sm leading-7 text-white/78">{value}</dd>
    </div>
  );
}

function DomainChip({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "gold" | "cyan" | "neutral" | "alert";
}) {
  const classes = {
    gold: "border-[rgba(201,168,76,0.34)] text-[#f0d27d]",
    cyan: "border-[rgba(0,212,255,0.3)] text-[#93efff]",
    neutral: "border-[rgba(255,255,255,0.18)] text-white",
    alert: "border-[rgba(255,89,120,0.32)] text-[#ff8da4]"
  };

  return (
    <div className={`border bg-[rgba(10,10,10,0.76)] px-4 py-4 ${classes[tone]}`}>
      <p className="schematic-label text-[11px] text-[rgba(255,255,255,0.48)]">{label}</p>
      <p className="mt-2 font-mono text-lg">{value}</p>
    </div>
  );
}
